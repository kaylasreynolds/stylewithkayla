import { deliverAppointmentEmails } from "@/lib/server/appointment-email-delivery";
import { sha256 } from "@/lib/server/crypto";
import { ApiError, dataResponse, optionalString, readJsonObject, rejectUnexpectedKeys, withApi } from "@/lib/server/http";
import { requireClientActionAccess } from "@/lib/server/profile-access";
import { getD1 } from "@/lib/server/runtime";

type Params = { params: Promise<{ token: string }> };
type Booking = {
  status: string;
  publicReference: string;
  proposedStartAt: number | null;
  proposedEndAt: number | null;
  serviceName: string;
  audience: "women" | "men";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string | null;
};

export async function POST(request: Request, ctx: Params) {
  return withApi(async id => {
    const { token } = await ctx.params;
    const access = await requireClientActionAccess(token);
    const body = await readJsonObject(request);
    rejectUnexpectedKeys(body, ["reason"]);
    const reason = optionalString(body.reason, "reason", 1000) || "Client declined the proposed appointment time.";
    const db = getD1();
    const booking = await db.prepare(`SELECT b.status,b.public_reference AS publicReference,b.proposed_start_at AS proposedStartAt,b.proposed_end_at AS proposedEndAt,b.booking_notes AS notes,s.name AS serviceName,s.audience,c.full_name AS clientName,c.email AS clientEmail,c.phone AS clientPhone FROM bookings b JOIN services s ON s.id=b.service_id JOIN clients c ON c.id=b.client_id WHERE b.id=?`).bind(access.bookingId).first<Booking>();
    if (!booking || booking.status !== "change_proposed" || booking.proposedStartAt === null || booking.proposedEndAt === null) {
      throw new ApiError(409, "ACTION_NO_LONGER_AVAILABLE", "This alternate-time request is no longer active.");
    }

    const now = Date.now();
    const idempotencyKeyHash = await sha256(request.headers.get("idempotency-key") || crypto.randomUUID());
    const results = await db.batch([
      db.prepare(`UPDATE bookings SET status='cancelled',cancelled_at=?,updated_at=? WHERE id=? AND status='change_proposed'`).bind(now, now, access.bookingId),
      db.prepare(`UPDATE booking_holds SET active=0,released_at=?,release_reason=? WHERE booking_id=? AND active=1 AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status='cancelled')`).bind(now, reason, access.bookingId, access.bookingId),
      db.prepare(`UPDATE private_access_tokens SET revoked_at=? WHERE booking_id=? AND purpose='alternate_time' AND revoked_at IS NULL AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status='cancelled')`).bind(now, access.bookingId, access.bookingId),
      db.prepare(`INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_type,reason,metadata,created_at) SELECT ?,id,'change_proposed','cancelled','client',?,?,? FROM bookings WHERE id=? AND status='cancelled' AND updated_at=?`).bind(crypto.randomUUID(), reason, JSON.stringify({ action: "decline_proposed_time", tokenId: access.tokenId, idempotencyKeyHash }), now, access.bookingId, now),
    ]);
    const updated = await db.prepare(`SELECT status FROM bookings WHERE id=?`).bind(access.bookingId).first<{ status: string }>();
    if (!Number(results[0]?.meta.changes || 0) || updated?.status !== "cancelled") throw new ApiError(409, "ACTION_NO_LONGER_AVAILABLE", "This alternate-time request changed. Please contact Kayla.");

    const emailDelivery = await deliverAppointmentEmails(db, "proposal_declined", {
      bookingId: access.bookingId,
      publicReference: booking.publicReference,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      serviceName: booking.serviceName,
      audience: booking.audience,
      startsAt: booking.proposedStartAt,
      endsAt: booking.proposedEndAt,
      notes: booking.notes,
      reason,
    });
    return dataResponse({ status: "cancelled", emailDelivery }, 200, id);
  });
}
