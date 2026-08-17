import { deliverAppointmentEmails } from "@/lib/server/appointment-email-delivery";
import { ApiError, dataResponse, readJsonObject, rejectUnexpectedKeys, requiredString, validation, withApi } from "@/lib/server/http";
import { requireClientActionAccess } from "@/lib/server/profile-access";
import { getD1 } from "@/lib/server/runtime";
import { calculateAvailability, localDateKey } from "@/lib/server/scheduling";

type Params = { params: Promise<{ token: string }> };
type Booking = { status: string; publicReference: string; proposedStartAt: number | null; proposedEndAt: number | null; serviceCode: string; serviceName: string; audience: "women" | "men"; clientName: string; clientEmail: string; clientPhone: string; notes: string | null };

export async function POST(request: Request, ctx: Params) {
  return withApi(async id => {
    const { token } = await ctx.params;
    const access = await requireClientActionAccess(token);
    const body = await readJsonObject(request);
    rejectUnexpectedKeys(body, ["requestedStartAt"]);
    const text = requiredString(body.requestedStartAt, "requestedStartAt", 40);
    const start = Date.parse(text);
    if (!Number.isFinite(start) || new Date(start).toISOString() !== text) throw validation("requestedStartAt", "Choose an available appointment time.");
    const db = getD1();
    const booking = await db.prepare(`SELECT b.status,b.public_reference AS publicReference,b.proposed_start_at AS proposedStartAt,b.proposed_end_at AS proposedEndAt,b.booking_notes AS notes,s.code AS serviceCode,s.name AS serviceName,s.audience,c.full_name AS clientName,c.email AS clientEmail,c.phone AS clientPhone FROM bookings b JOIN services s ON s.id=b.service_id JOIN clients c ON c.id=b.client_id WHERE b.id=?`).bind(access.bookingId).first<Booking>();
    if (!booking || booking.status !== "change_proposed") throw new ApiError(409, "ACTION_NO_LONGER_AVAILABLE", "This alternate-time request is no longer active.");
    const date = localDateKey(start, "America/Boise");
    const availability = await calculateAvailability(db, booking.serviceCode, date, date, Date.now(), access.bookingId);
    const slot = availability.slots.find(item => item.startsAt === text);
    if (!slot) throw new ApiError(409, "SLOT_UNAVAILABLE", "That time is no longer available.");
    const end = Date.parse(slot.endsAt);
    const holdId = crypto.randomUUID();
    const now = Date.now();
    await db.batch([
      db.prepare(`UPDATE booking_holds SET active=0,released_at=?,release_reason='Client requested another time' WHERE booking_id=? AND active=1`).bind(now, access.bookingId),
      db.prepare(`INSERT INTO booking_holds(id,booking_id,kind,starts_at,ends_at,active,created_at) SELECT ?,id,'requested',?,?,1,? FROM bookings WHERE id=? AND status='change_proposed' AND NOT EXISTS(SELECT 1 FROM booking_holds h WHERE h.active=1 AND h.booking_id<>? AND h.starts_at<? AND h.ends_at>?)`).bind(holdId, start, end, now, access.bookingId, access.bookingId, end, start),
      db.prepare(`UPDATE bookings SET status='pending',requested_start_at=?,requested_end_at=?,proposed_start_at=NULL,proposed_end_at=NULL,pending_since=?,updated_at=? WHERE id=? AND status='change_proposed' AND EXISTS(SELECT 1 FROM booking_holds WHERE id=? AND active=1)`).bind(start, end, now, now, access.bookingId, holdId),
      db.prepare(`UPDATE private_access_tokens SET revoked_at=? WHERE id=?`).bind(now, access.tokenId),
      db.prepare(`INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_type,metadata,created_at) SELECT ?,id,'change_proposed','pending','client',?,? FROM bookings WHERE id=? AND status='pending'`).bind(crypto.randomUUID(), JSON.stringify({ action: "request_another_time", priorProposedStartAt: booking.proposedStartAt ? new Date(booking.proposedStartAt).toISOString() : null, priorProposedEndAt: booking.proposedEndAt ? new Date(booking.proposedEndAt).toISOString() : null, newRequestedStartAt: text, newRequestedEndAt: slot.endsAt, tokenId: access.tokenId }), now, access.bookingId),
    ]);
    const updated = await db.prepare(`SELECT status FROM bookings WHERE id=?`).bind(access.bookingId).first<{ status: string }>();
    if (updated?.status !== "pending") throw new ApiError(409, "SLOT_UNAVAILABLE", "That time is no longer available.");
    const emailDelivery = await deliverAppointmentEmails(db, "another_time_requested", { bookingId: access.bookingId, publicReference: booking.publicReference, clientName: booking.clientName, clientEmail: booking.clientEmail, clientPhone: booking.clientPhone, serviceName: booking.serviceName, audience: booking.audience, startsAt: start, endsAt: end, notes: booking.notes });
    return dataResponse({ status: "pending", requestedStartAt: text, requestedEndAt: slot.endsAt, emailDelivery }, 200, id);
  });
}
