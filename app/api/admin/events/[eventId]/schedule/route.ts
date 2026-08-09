import { requireAdmin } from "@/lib/server/admin-auth";
import { instant } from "@/lib/server/event-management";
import {
  ApiError,
  dataResponse,
  optionalString,
  readJsonObject,
  rejectUnexpectedKeys,
  withApi,
} from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  return withApi(async id => {
    requireAdmin(request);
    const eventId = (await params).eventId;
    const rows = (
      await getD1()
        .prepare(
          "SELECT s.id,s.event_id eventId,s.rsvp_id rsvpId,s.starts_at startsAt,s.ends_at endsAt,s.label,r.primary_guest_name guestName FROM event_appointment_slots s LEFT JOIN event_rsvps r ON r.id=s.rsvp_id WHERE s.event_id=? ORDER BY s.starts_at",
        )
        .bind(eventId)
        .all<Record<string, unknown>>()
    ).results;

    return dataResponse(
      {
        slots: rows.map(row => ({
          ...row,
          startsAt: new Date(row.startsAt as number).toISOString(),
          endsAt: new Date(row.endsAt as number).toISOString(),
        })),
      },
      200,
      id,
    );
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
    rejectUnexpectedKeys(body, ["startsAt", "endsAt", "rsvpId", "label"]);

    const start = instant(body.startsAt, "startsAt");
    const end = instant(body.endsAt, "endsAt");
    if (end <= start) {
      throw new ApiError(
        422,
        "VALIDATION_ERROR",
        "Please check the highlighted fields.",
        { endsAt: "End time must be after start time." },
      );
    }

    const rsvpId = optionalString(body.rsvpId, "rsvpId", 64);
    const label = optionalString(body.label, "label", 160);
    const db = getD1();
    const event = await db
      .prepare("SELECT starts_at startsAt,ends_at endsAt,status FROM events WHERE id=?")
      .bind(eventId)
      .first<{ startsAt: number; endsAt: number; status: string }>();

    if (!event) throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found.");
    if (start < event.startsAt || end > event.endsAt) {
      throw new ApiError(422, "SLOT_OUTSIDE_EVENT", "Appointment must occur within the event.");
    }

    const collision = await db
      .prepare("SELECT id FROM event_appointment_slots WHERE event_id=? AND starts_at<? AND ends_at>? LIMIT 1")
      .bind(eventId, end, start)
      .first();
    if (collision) {
      throw new ApiError(409, "APPOINTMENT_COLLISION", "This appointment overlaps another slot.");
    }

    if (
      rsvpId &&
      !(await db
        .prepare("SELECT id FROM event_rsvps WHERE id=? AND event_id=?")
        .bind(rsvpId, eventId)
        .first())
    ) {
      throw new ApiError(422, "INVALID_RSVP", "RSVP does not belong to this event.");
    }

    const slotId = crypto.randomUUID();
    await db
      .prepare("INSERT INTO event_appointment_slots(id,event_id,rsvp_id,starts_at,ends_at,label) VALUES(?,?,?,?,?,?)")
      .bind(slotId, eventId, rsvpId, start, end, label)
      .run();

    return dataResponse(
      {
        slot: {
          id: slotId,
          eventId,
          rsvpId,
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
          label,
        },
      },
      201,
      id,
    );
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  return withApi(async id => {
    requireAdmin(request);
    const eventId = (await params).eventId;
    const slotId = new URL(request.url).searchParams.get("slotId");
    if (!slotId) throw new ApiError(422, "VALIDATION_ERROR", "A slotId is required.");

    const db = getD1();
    const slot = await db
      .prepare("SELECT rsvp_id AS rsvpId FROM event_appointment_slots WHERE id=? AND event_id=?")
      .bind(slotId, eventId)
      .first<{ rsvpId: string | null }>();

    if (!slot) throw new ApiError(404, "SLOT_NOT_FOUND", "Appointment slot not found.");
    if (slot.rsvpId) {
      throw new ApiError(
        409,
        "BOOKED_SLOT",
        "Booked appointment slots cannot be deleted. Cancel or move the RSVP first.",
      );
    }

    await db
      .prepare("DELETE FROM event_appointment_slots WHERE id=? AND event_id=?")
      .bind(slotId, eventId)
      .run();

    return dataResponse({ deleted: true }, 200, id);
  });
}
