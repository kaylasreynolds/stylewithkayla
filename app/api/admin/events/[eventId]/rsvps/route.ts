import { requireAdmin } from "@/lib/server/admin-auth";
import { sendEventConfirmationEmail } from "@/lib/server/event-confirmation-email";
import {
  rsvpStatuses,
  enumValue,
  positiveInteger,
  iso,
  instant,
} from "@/lib/server/event-management";
import {
  ApiError,
  dataResponse,
  readJsonObject,
  rejectUnexpectedKeys,
  requiredString,
  optionalString,
  withApi,
} from "@/lib/server/http";
import { getD1, getEventEmailConfig } from "@/lib/server/runtime";

const json = (row: Record<string, unknown>) => ({
  ...row,
  checkedInAt: iso(row.checkedInAt as number | null),
  noShowAt: iso(row.noShowAt as number | null),
  createdAt: iso(row.createdAt as number),
  updatedAt: iso(row.updatedAt as number),
  appointmentStartsAt: iso(row.appointmentStartsAt as number | null),
  appointmentEndsAt: iso(row.appointmentEndsAt as number | null),
});

type EventEmailRow = {
  capacity: number | null;
  status: string;
  unlimitedCapacity: number;
  title: string;
  offer: string | null;
  offerDetails: string | null;
  location: string;
  locationDetails: string | null;
  startsAt: number;
  endsAt: number;
  timezone: string;
};

type AppointmentRow = {
  startsAt: number;
  endsAt: number;
  label: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  return withApi(async id => {
    requireAdmin(request);
    const eventId = (await params).eventId;
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim() ?? "";
    const checkIn = url.searchParams.get("checkIn");

    if (status && !rsvpStatuses.includes(status as never)) {
      throw new ApiError(422, "INVALID_STATUS", "Choose a valid RSVP status.");
    }
    if (checkIn && !["checked-in", "pending", "no-show"].includes(checkIn)) {
      throw new ApiError(
        422,
        "INVALID_CHECK_IN_FILTER",
        "Choose a valid check-in filter.",
      );
    }

    const clauses = ["r.event_id=?"];
    const binds: unknown[] = [eventId];
    if (status) {
      clauses.push("r.status=?");
      binds.push(status);
    }
    if (q) {
      clauses.push("(r.primary_guest_name LIKE ? OR r.email LIKE ?)");
      binds.push(`%${q}%`, `%${q}%`);
    }
    if (checkIn === "checked-in") clauses.push("r.checked_in_at IS NOT NULL");
    if (checkIn === "pending") {
      clauses.push("r.checked_in_at IS NULL AND r.no_show_at IS NULL");
    }
    if (checkIn === "no-show") clauses.push("r.no_show_at IS NOT NULL");

    const rows = (
      await getD1()
        .prepare(
          `SELECT r.id,r.event_id eventId,r.status,r.primary_guest_name primaryGuestName,r.email,r.phone,r.party_size partySize,r.notes,r.checked_in_at checkedInAt,r.no_show_at noShowAt,r.created_at createdAt,r.updated_at updatedAt,s.starts_at appointmentStartsAt,s.ends_at appointmentEndsAt,s.label appointmentLabel FROM event_rsvps r LEFT JOIN event_appointment_slots s ON s.rsvp_id=r.id AND s.event_id=r.event_id WHERE ${clauses.join(" AND ")} ORDER BY COALESCE(s.starts_at,r.created_at) ASC LIMIT 500`,
        )
        .bind(...binds)
        .all<Record<string, unknown>>()
    ).results;

    return dataResponse({ rsvps: rows.map(json) }, 200, id);
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  return withApi(async id => {
    requireAdmin(request);
    const eventId = (await params).eventId;
    const body = await readJsonObject(request);

    rejectUnexpectedKeys(body, [
      "primaryGuestName",
      "email",
      "phone",
      "partySize",
      "notes",
      "status",
      "guests",
      "appointmentSlotId",
      "customStartsAt",
      "customEndsAt",
      "sendConfirmation",
    ]);

    const name = requiredString(body.primaryGuestName, "primaryGuestName", 160);
    const email = requiredString(body.email, "email", 254).toLowerCase();
    const phone = optionalString(body.phone, "phone", 40);
    const party = positiveInteger(body.partySize ?? 1, "partySize", 20);
    const notes = optionalString(body.notes, "notes", 2000);
    const status =
      body.status === undefined
        ? "confirmed"
        : enumValue(body.status, "status", rsvpStatuses);
    const appointmentSlotId = optionalString(
      body.appointmentSlotId,
      "appointmentSlotId",
      64,
    );
    const sendConfirmation =
      body.sendConfirmation === undefined ? true : body.sendConfirmation === true;

    if (
      body.guests !== undefined &&
      (!Array.isArray(body.guests) ||
        body.guests.some(item => typeof item !== "string" || !item.trim()))
    ) {
      throw new ApiError(422, "VALIDATION_ERROR", "Please check the highlighted fields.", {
        guests: "Guests must be an array of names.",
      });
    }

    if (appointmentSlotId && (body.customStartsAt !== undefined || body.customEndsAt !== undefined)) {
      throw new ApiError(
        422,
        "VALIDATION_ERROR",
        "Choose either an available appointment time or a custom time, not both.",
      );
    }

    let customStart: number | null = null;
    let customEnd: number | null = null;
    if (body.customStartsAt !== undefined || body.customEndsAt !== undefined) {
      customStart = instant(body.customStartsAt, "customStartsAt");
      customEnd = instant(body.customEndsAt, "customEndsAt");
      if (customEnd <= customStart) {
        throw new ApiError(
          422,
          "VALIDATION_ERROR",
          "Custom appointment end time must be after the start time.",
        );
      }
      if (
        new Date(customStart).getUTCMinutes() % 15 !== 0 ||
        new Date(customEnd).getUTCMinutes() % 15 !== 0
      ) {
        throw new ApiError(
          422,
          "VALIDATION_ERROR",
          "Custom appointment times must use 15-minute increments.",
        );
      }
    }

    const db = getD1();
    const event = await db
      .prepare(
        `SELECT capacity,status,unlimited_capacity unlimitedCapacity,title,offer,offer_details offerDetails,location,location_details locationDetails,starts_at startsAt,ends_at endsAt,timezone FROM events WHERE id=?`,
      )
      .bind(eventId)
      .first<EventEmailRow>();

    if (!event) throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found.");
    if (event.status === "archived") {
      throw new ApiError(409, "EVENT_ARCHIVED", "Archived events cannot accept RSVPs.");
    }

    if (status === "confirmed" && !event.unlimitedCapacity) {
      const used = await db
        .prepare(
          "SELECT COALESCE(SUM(party_size),0) n FROM event_rsvps WHERE event_id=? AND status='confirmed'",
        )
        .bind(eventId)
        .first<{ n: number }>();
      if ((used?.n ?? 0) + party > (event.capacity ?? 0)) {
        throw new ApiError(
          409,
          "EVENT_CAPACITY_EXCEEDED",
          "This RSVP exceeds event capacity.",
        );
      }
    }

    if (appointmentSlotId) {
      const slot = await db
        .prepare(
          "SELECT id FROM event_appointment_slots WHERE id=? AND event_id=? AND rsvp_id IS NULL",
        )
        .bind(appointmentSlotId, eventId)
        .first();
      if (!slot) {
        throw new ApiError(
          409,
          "SLOT_UNAVAILABLE",
          "That appointment time is no longer available.",
        );
      }
    }

    if (customStart !== null && customEnd !== null) {
      if (customStart < event.startsAt || customEnd > event.endsAt) {
        throw new ApiError(
          422,
          "SLOT_OUTSIDE_EVENT",
          "Custom appointments must occur within the event time.",
        );
      }
      const collision = await db
        .prepare(
          "SELECT id FROM event_appointment_slots WHERE event_id=? AND rsvp_id IS NOT NULL AND starts_at<? AND ends_at>? LIMIT 1",
        )
        .bind(eventId, customEnd, customStart)
        .first();
      if (collision) {
        throw new ApiError(
          409,
          "APPOINTMENT_COLLISION",
          "That custom time overlaps an existing booked appointment.",
        );
      }
    }

    const rsvpId = crypto.randomUUID();
    const token = crypto.randomUUID().replaceAll("-", "");
    const now = Date.now();
    const guests = (body.guests as string[] | undefined) ?? [];
    const statements = [
      db
        .prepare(
          "INSERT INTO event_rsvps(id,event_id,public_token,status,primary_guest_name,email,phone,party_size,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(rsvpId, eventId, token, status, name, email, phone, party, notes, now, now),
      ...guests.map(guest =>
        db
          .prepare("INSERT INTO event_guests(id,rsvp_id,name,created_at) VALUES(?,?,?,?)")
          .bind(crypto.randomUUID(), rsvpId, guest.trim(), now),
      ),
    ];

    let appointment: AppointmentRow | null = null;

    if (appointmentSlotId) {
      statements.push(
        db
          .prepare(
            "UPDATE event_appointment_slots SET rsvp_id=? WHERE id=? AND event_id=? AND rsvp_id IS NULL",
          )
          .bind(rsvpId, appointmentSlotId, eventId),
      );
    } else if (customStart !== null && customEnd !== null) {
      const slotId = crypto.randomUUID();
      statements.push(
        db
          .prepare(
            "DELETE FROM event_appointment_slots WHERE event_id=? AND rsvp_id IS NULL AND starts_at<? AND ends_at>?",
          )
          .bind(eventId, customEnd, customStart),
      );
      statements.push(
        db
          .prepare(
            "INSERT INTO event_appointment_slots(id,event_id,rsvp_id,starts_at,ends_at,label) VALUES(?,?,?,?,?,?)",
          )
          .bind(slotId, eventId, rsvpId, customStart, customEnd, "Custom admin appointment"),
      );
      appointment = {
        startsAt: customStart,
        endsAt: customEnd,
        label: "Custom admin appointment",
      };
    }

    await db.batch(statements);

    if (appointmentSlotId) {
      appointment = await db
        .prepare(
          "SELECT starts_at startsAt,ends_at endsAt,label FROM event_appointment_slots WHERE id=? AND event_id=? AND rsvp_id=?",
        )
        .bind(appointmentSlotId, eventId, rsvpId)
        .first<AppointmentRow>();
      if (!appointment) {
        throw new ApiError(
          409,
          "SLOT_UNAVAILABLE",
          "That appointment time was taken before the RSVP could be completed.",
        );
      }
    }

    let emailSent = false;
    let emailWarning: string | null = null;
    if (sendConfirmation) {
      const emailConfig = getEventEmailConfig();
      if (!emailConfig) {
        emailWarning = "RSVP saved, but event email is not configured.";
      } else {
        try {
          await sendEventConfirmationEmail(emailConfig, {
            to: email,
            guestName: name,
            eventTitle: event.title,
            eventStartsAt: event.startsAt,
            eventEndsAt: event.endsAt,
            timezone: event.timezone,
            location: [event.location, event.locationDetails].filter(Boolean).join(", "),
            eventOffer: [event.offer, event.offerDetails].filter(Boolean).join(" — ") || null,
            appointmentStartsAt: appointment?.startsAt,
            appointmentEndsAt: appointment?.endsAt,
            appointmentLabel: appointment?.label,
            notes,
          });
          emailSent = true;
        } catch (error) {
          console.error("Admin event confirmation email failed", {
            eventId,
            rsvpId,
            error: error instanceof Error ? error.message : String(error),
          });
          emailWarning = "RSVP saved, but the confirmation email could not be sent.";
        }
      }
    }

    return dataResponse(
      {
        rsvp: {
          id: rsvpId,
          eventId,
          status,
          primaryGuestName: name,
          email,
          phone,
          partySize: party,
          notes,
          guests,
          appointmentStartsAt: appointment ? new Date(appointment.startsAt).toISOString() : null,
          appointmentEndsAt: appointment ? new Date(appointment.endsAt).toISOString() : null,
          appointmentLabel: appointment?.label ?? null,
        },
        emailSent,
        warning: emailWarning,
      },
      201,
      id,
    );
  });
}
