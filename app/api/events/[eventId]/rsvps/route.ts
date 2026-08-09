import { sha256 } from "@/lib/server/crypto";
import { sendEventConfirmationEmail } from "@/lib/server/event-confirmation-email";
import { ApiError, dataResponse, readJsonObject, withApi } from "@/lib/server/http";
import { assertRegistrationOpen, parsePublicRsvp } from "@/lib/server/public-events";
import { getD1, getEventEmailConfig } from "@/lib/server/runtime";

type Context = { params: Promise<{ eventId: string }> };

type EventRow = {
  title: string;
  description: string;
  offer: string | null;
  offerDetails: string | null;
  location: string;
  locationDetails: string | null;
  startsAt: number;
  endsAt: number;
  timezone: string;
  registrationOpensAt: number | null;
  registrationClosesAt: number | null;
  capacity: number;
  maxGuests: number;
  allowDuplicateRegistration: number;
  appointmentRequired: number;
};

type AppointmentRow = {
  startsAt: number;
  endsAt: number;
  label: string | null;
};

export async function POST(request: Request, { params }: Context) {
  return withApi(async (requestId) => {
    const { eventId } = await params;
    const db = getD1();
    const event = await db
      .prepare(`
        SELECT
          title,
          description,
          offer,
          offer_details AS offerDetails,
          location,
          location_details AS locationDetails,
          starts_at AS startsAt,
          ends_at AS endsAt,
          timezone,
          registration_opens_at AS registrationOpensAt,
          registration_closes_at AS registrationClosesAt,
          capacity,
          max_guests AS maxGuests,
          allow_duplicate_registration AS allowDuplicateRegistration,
          appointment_required AS appointmentRequired
        FROM events
        WHERE id=? AND status='published' AND archived_at IS NULL
      `)
      .bind(eventId)
      .first<EventRow>();

    if (!event) throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found.");
    assertRegistrationOpen(event);

    const input = parsePublicRsvp(
      await readJsonObject(request),
      event.maxGuests,
      Boolean(event.appointmentRequired),
    );

    const rawKey = request.headers.get("idempotency-key")?.trim();
    if (!rawKey || rawKey.length > 200) {
      throw new ApiError(
        400,
        "IDEMPOTENCY_KEY_REQUIRED",
        "Include a valid Idempotency-Key header.",
      );
    }

    const canonical = JSON.stringify({ eventId, ...input });
    const keyHash = await sha256(rawKey);
    const payloadHash = await sha256(canonical);
    const existing = await db
      .prepare(`
        SELECT
          i.payload_hash AS payloadHash,
          r.public_token AS publicToken,
          r.status,
          r.party_size AS partySize
        FROM event_rsvp_idempotency i
        JOIN event_rsvps r ON r.id=i.rsvp_id
        WHERE i.key_hash=?
      `)
      .bind(keyHash)
      .first<{
        payloadHash: string;
        publicToken: string;
        status: string;
        partySize: number;
      }>();

    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        throw new ApiError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "That idempotency key was already used for a different registration.",
        );
      }

      return result(existing, requestId);
    }

    if (!event.allowDuplicateRegistration) {
      const duplicate = await db
        .prepare(`
          SELECT 1 found
          FROM event_rsvps
          WHERE event_id=? AND lower(email)=? AND status IN ('confirmed','waitlisted')
          LIMIT 1
        `)
        .bind(eventId, input.email)
        .first();

      if (duplicate) {
        throw new ApiError(
          409,
          "DUPLICATE_REGISTRATION",
          "This email is already registered for the event.",
        );
      }
    }

    if (input.appointmentSlotId) {
      const slot = await db
        .prepare(`
          SELECT id
          FROM event_appointment_slots
          WHERE id=? AND event_id=? AND rsvp_id IS NULL AND starts_at>?
        `)
        .bind(input.appointmentSlotId, eventId, Date.now())
        .first();

      if (!slot) {
        throw new ApiError(
          409,
          "SLOT_UNAVAILABLE",
          "That appointment time is no longer available.",
        );
      }
    }

    const used = await db
      .prepare(`
        SELECT COALESCE(SUM(party_size),0) n
        FROM event_rsvps
        WHERE event_id=? AND status='confirmed'
      `)
      .bind(eventId)
      .first<{ n: number }>();

    if ((used?.n ?? 0) + input.partySize > event.capacity) {
      throw new ApiError(
        409,
        "EVENT_FULL",
        "There are not enough spots remaining for this party.",
      );
    }

    const rsvpId = crypto.randomUUID();
    const publicToken = crypto.randomUUID();
    const now = Date.now();
    const conditions = `
      e.id=?
      AND e.status='published'
      AND e.archived_at IS NULL
      AND e.starts_at>?
      AND (e.registration_opens_at IS NULL OR e.registration_opens_at<=?)
      AND (e.registration_closes_at IS NULL OR e.registration_closes_at>=?)
      AND (
        SELECT COALESCE(SUM(party_size),0)
        FROM event_rsvps
        WHERE event_id=e.id AND status='confirmed'
      )+?<=e.capacity
      ${
        event.allowDuplicateRegistration
          ? ""
          : "AND NOT EXISTS(SELECT 1 FROM event_rsvps WHERE event_id=e.id AND lower(email)=? AND status IN ('confirmed','waitlisted'))"
      }
      ${
        input.appointmentSlotId
          ? "AND EXISTS(SELECT 1 FROM event_appointment_slots WHERE id=? AND event_id=e.id AND rsvp_id IS NULL AND starts_at>?)"
          : ""
      }
    `;

    const binds: unknown[] = [
      rsvpId,
      eventId,
      publicToken,
      input.name,
      input.email,
      input.phone,
      input.partySize,
      input.notes,
      now,
      now,
      eventId,
      now,
      now,
      now,
      input.partySize,
    ];

    if (!event.allowDuplicateRegistration) binds.push(input.email);
    if (input.appointmentSlotId) binds.push(input.appointmentSlotId, now);

    const statements = [
      db
        .prepare(`
          INSERT INTO event_rsvps(
            id,event_id,public_token,status,primary_guest_name,email,phone,
            party_size,notes,created_at,updated_at
          )
          SELECT ?,?,?,?,?,?,?,?,?,?,?
          FROM events e
          WHERE ${conditions}
        `)
        .bind(...binds),
      ...input.guestNames.map((name) =>
        db
          .prepare(`
            INSERT INTO event_guests(id,rsvp_id,name,created_at)
            SELECT ?,?,?,?
            WHERE EXISTS(SELECT 1 FROM event_rsvps WHERE id=?)
          `)
          .bind(crypto.randomUUID(), rsvpId, name, now, rsvpId),
      ),
    ];

    if (input.appointmentSlotId) {
      statements.push(
        db
          .prepare(`
            UPDATE event_appointment_slots
            SET rsvp_id=?
            WHERE id=? AND rsvp_id IS NULL
              AND EXISTS(SELECT 1 FROM event_rsvps WHERE id=?)
          `)
          .bind(rsvpId, input.appointmentSlotId, rsvpId),
      );
    }

    statements.push(
      db
        .prepare(`
          INSERT INTO event_rsvp_idempotency(key_hash,payload_hash,rsvp_id,created_at)
          SELECT ?,?,?,?
          WHERE EXISTS(SELECT 1 FROM event_rsvps WHERE id=?)
        `)
        .bind(keyHash, payloadHash, rsvpId, now, rsvpId),
    );

    await db.batch(statements);

    const created = await db
      .prepare(`
        SELECT public_token AS publicToken,status,party_size AS partySize
        FROM event_rsvps
        WHERE id=?
      `)
      .bind(rsvpId)
      .first<{ publicToken: string; status: string; partySize: number }>();

    if (!created) {
      throw new ApiError(
        409,
        "REGISTRATION_UNAVAILABLE",
        "Registration changed while you were submitting. Please review availability and try again.",
      );
    }

    const emailConfig = getEventEmailConfig();
    if (emailConfig) {
      let appointment: AppointmentRow | null = null;

      if (input.appointmentSlotId) {
        appointment = await db
          .prepare(`
            SELECT starts_at AS startsAt, ends_at AS endsAt, label
            FROM event_appointment_slots
            WHERE id=? AND rsvp_id=?
          `)
          .bind(input.appointmentSlotId, rsvpId)
          .first<AppointmentRow>();
      }

      try {
        await sendEventConfirmationEmail(emailConfig, {
          to: input.email,
          guestName: input.name,
          eventTitle: event.title,
          eventStartsAt: event.startsAt,
          eventEndsAt: event.endsAt,
          timezone: event.timezone,
          location: [event.location, event.locationDetails].filter(Boolean).join(", "),
          eventOffer: [event.offer, event.offerDetails].filter(Boolean).join(" — ") || null,
          appointmentStartsAt: appointment?.startsAt,
          appointmentEndsAt: appointment?.endsAt,
          appointmentLabel: appointment?.label,
          notes: input.notes,
        });
      } catch (error) {
        console.error("Event confirmation email failed", {
          eventId,
          rsvpId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result(created, requestId);
  });
}

function result(
  registration: { publicToken: string; status: string; partySize: number },
  requestId: string,
) {
  return dataResponse({ registration }, 201, requestId);
}
