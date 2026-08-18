import { deliverAppointmentEmails } from "@/lib/server/appointment-email-delivery";
import { sha256 } from "@/lib/server/crypto";
import { ApiError, dataResponse, optionalString, readJsonObject, rejectUnexpectedKeys, withApi } from "@/lib/server/http";
import { requireManageAccess } from "@/lib/server/profile-access";
import { getD1 } from "@/lib/server/runtime";

type Params = { params: Promise<{ token: string }> };
type Booking = { status: string; publicReference: string; startsAt: number; endsAt: number; clientName: string; clientEmail: string; clientPhone: string; serviceName: string; audience: "women" | "men"; notes: string | null };

export async function POST(request: Request, ctx: Params) {
  return withApi(async id => {
    const { token } = await ctx.params;
    const access = await requireManageAccess(token);
    const body = await readJsonObject(request);
    rejectUnexpectedKeys(body, ["reason"]);
    const reason = optionalString(body.reason, "reason", 1000);
    const db = getD1();
    const booking = await db.prepare(`SELECT b.status,b.public_reference AS publicReference,b.confirmed_start_at AS startsAt,b.confirmed_end_at AS endsAt,b.booking_notes AS notes,c.full_name AS clientName,c.email AS clientEmail,c.phone AS clientPhone,s.name AS serviceName,s.audience FROM bookings b JOIN clients c ON c.id=b.client_id JOIN services s ON s.id=b.service_id WHERE b.id=?`).bind(access.bookingId).first<Booking>();
    if (!booking || booking.status !== "confirmed") throw new ApiError(409, "APPOINTMENT_NOT_CONFIRMED", "This appointment is no longer active.");
    const now = Date.now();
    const idempotencyKeyHash = await sha256(request.headers.get("idempotency-key") || crypto.randomUUID());
    const results = await db.batch([
      db.prepare(`UPDATE bookings SET status='cancelled',cancelled_at=?,updated_at=? WHERE id=? AND status='confirmed'`).bind(now, now, access.bookingId),
      db.prepare(`UPDATE booking_holds SET active=0,released_at=?,release_reason=? WHERE booking_id=? AND active=1`).bind(now, reason || "Cancelled by client", access.bookingId),
      db.prepare(`UPDATE reschedule_requests SET status='declined',reviewed_at=? WHERE booking_id=? AND status='pending'`).bind(now, access.bookingId),
      db.prepare(`UPDATE private_access_tokens SET revoked_at=? WHERE booking_id=? AND purpose<>'manage_appointment' AND revoked_at IS NULL`).bind(now, access.bookingId),
      db.prepare(`INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_type,reason,metadata,created_at) SELECT ?,id,'confirmed','cancelled','client',?,?,? FROM bookings WHERE id=? AND status='cancelled' AND updated_at=?`).bind(crypto.randomUUID(), reason, JSON.stringify({ action: "client_cancel", tokenId: access.tokenId, idempotencyKeyHash }), now, access.bookingId, now),
    ]);
    if (!Number(results[0]?.meta.changes || 0)) throw new ApiError(409, "APPOINTMENT_STATE_CHANGED", "This appointment changed before it could be cancelled. Refresh and try again.");
    const emailDelivery = await deliverAppointmentEmails(db, "client_cancelled", { bookingId: access.bookingId, publicReference: booking.publicReference, clientName: booking.clientName, clientEmail: booking.clientEmail, clientPhone: booking.clientPhone, serviceName: booking.serviceName, audience: booking.audience, startsAt: booking.startsAt, endsAt: booking.endsAt, notes: booking.notes, reason });
    return dataResponse({ status: "cancelled", emailDelivery }, 200, id);
  });
}
