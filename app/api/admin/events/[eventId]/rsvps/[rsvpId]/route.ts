import { requireAdmin } from "@/lib/server/admin-auth";
import {
  rsvpStatuses,
  enumValue,
  positiveInteger,
  iso,
} from "@/lib/server/event-management";
import {
  ApiError,
  dataResponse,
  readJsonObject,
  rejectUnexpectedKeys,
  optionalString,
  requiredString,
  withApi,
} from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

async function get(eventId: string, rsvpId: string) {
  const row = await getD1()
    .prepare(
      "SELECT id,event_id eventId,status,primary_guest_name primaryGuestName,email,phone,party_size partySize,notes,checked_in_at checkedInAt,no_show_at noShowAt,created_at createdAt,updated_at updatedAt FROM event_rsvps WHERE id=? AND event_id=?",
    )
    .bind(rsvpId, eventId)
    .first<Record<string, unknown>>();

  if (!row) {
    throw new ApiError(404, "RSVP_NOT_FOUND", "RSVP not found.");
  }

  const guests = (
    await getD1()
      .prepare(
        "SELECT id,name,checked_in_at checkedInAt FROM event_guests WHERE rsvp_id=? ORDER BY created_at",
      )
      .bind(rsvpId)
      .all<Record<string, unknown>>()
  ).results;

  return {
    ...row,
    checkedInAt: iso(row.checkedInAt as number | null),
    noShowAt: iso(row.noShowAt as number | null),
    createdAt: iso(row.createdAt as number),
    updatedAt: iso(row.updatedAt as number),
    guests: guests.map(guest => ({
      ...guest,
      checkedInAt: iso(guest.checkedInAt as number | null),
    })),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string; rsvpId: string }> },
) {
  return withApi(async requestId => {
    requireAdmin(request);
    const { eventId, rsvpId } = await params;

    return dataResponse(
      { rsvp: await get(eventId, rsvpId) },
      200,
      requestId,
    );
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string; rsvpId: string }> },
) {
  return withApi(async requestId => {
    requireAdmin(request);
    const { eventId, rsvpId } = await params;
    const current = await get(eventId, rsvpId);
    const body = await readJsonObject(request);

    rejectUnexpectedKeys(body, [
      "status",
      "primaryGuestName",
      "email",
      "phone",
      "partySize",
      "notes",
    ]);

    if (!Object.keys(body).length) {
      throw new ApiError(
        400,
        "EMPTY_UPDATE",
        "Provide at least one field to update.",
      );
    }

    const values: Record<string, unknown> = {};

    if ("status" in body) {
      values.status = enumValue(body.status, "status", rsvpStatuses);
    }
    if ("primaryGuestName" in body) {
      values.primary_guest_name = requiredString(
        body.primaryGuestName,
        "primaryGuestName",
        160,
      );
    }
    if ("email" in body) {
      values.email = requiredString(body.email, "email", 254).toLowerCase();
    }
    if ("phone" in body) {
      values.phone = optionalString(body.phone, "phone", 40);
    }
    if ("partySize" in body) {
      values.party_size = positiveInteger(body.partySize, "partySize", 20);
    }
    if ("notes" in body) {
      values.notes = optionalString(body.notes, "notes", 2000);
    }

    const becomingConfirmed = (values.status ?? current.status) === "confirmed";

    if (becomingConfirmed) {
      const capacity = await getD1()
        .prepare(
          "SELECT e.capacity capacity,e.unlimited_capacity unlimitedCapacity,COALESCE(SUM(CASE WHEN r.status='confirmed' AND r.id<>? THEN r.party_size ELSE 0 END),0) used FROM events e LEFT JOIN event_rsvps r ON r.event_id=e.id WHERE e.id=? GROUP BY e.id",
        )
        .bind(rsvpId, eventId)
        .first<{
          capacity: number | null;
          unlimitedCapacity: number;
          used: number;
        }>();

      if (!capacity) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found.");
      }

      if (
        !capacity.unlimitedCapacity &&
        capacity.used + Number(values.party_size ?? current.partySize) >
          (capacity.capacity ?? 0)
      ) {
        throw new ApiError(
          409,
          "EVENT_CAPACITY_EXCEEDED",
          "This update exceeds event capacity.",
        );
      }
    }

    const keys = Object.keys(values);

    await getD1()
      .prepare(
        `UPDATE event_rsvps SET ${keys
          .map(key => `${key}=?`)
          .join(",")},updated_at=? WHERE id=? AND event_id=?`,
      )
      .bind(...keys.map(key => values[key]), Date.now(), rsvpId, eventId)
      .run();

    return dataResponse(
      { rsvp: await get(eventId, rsvpId) },
      200,
      requestId,
    );
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string; rsvpId: string }> },
) {
  return withApi(async requestId => {
    requireAdmin(request);
    const { eventId, rsvpId } = await params;
    const db = getD1();

    const existing = await db
      .prepare("SELECT id FROM event_rsvps WHERE id=? AND event_id=?")
      .bind(rsvpId, eventId)
      .first();

    if (!existing) {
      throw new ApiError(404, "RSVP_NOT_FOUND", "RSVP not found.");
    }

    await db.batch([
      db
        .prepare(
          "UPDATE event_appointment_slots SET rsvp_id=NULL WHERE event_id=? AND rsvp_id=?",
        )
        .bind(eventId, rsvpId),
      db.prepare("DELETE FROM event_guests WHERE rsvp_id=?").bind(rsvpId),
      db
        .prepare("DELETE FROM event_rsvp_idempotency WHERE rsvp_id=?")
        .bind(rsvpId),
      db
        .prepare("DELETE FROM event_rsvps WHERE id=? AND event_id=?")
        .bind(rsvpId, eventId),
    ]);

    return dataResponse({ deleted: true }, 200, requestId);
  });
}
