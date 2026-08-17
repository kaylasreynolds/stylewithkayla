import { requireAdmin } from "@/lib/server/admin-auth";
import { deliverAppointmentEmails } from "@/lib/server/appointment-email-delivery";
import { ApiError, dataResponse, readJsonObject, rejectUnexpectedKeys, requiredString, withApi } from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

type Params = { params: Promise<{ bookingId: string }> };
type RequestRow = { id: string; startsAt: number; endsAt: number };
type Booking = { publicReference: string; startsAt: number; endsAt: number; clientName: string; clientEmail: string; clientPhone: string; serviceName: string; audience: "women" | "men"; notes: string | null };

export async function POST(request: Request, ctx: Params) {
  return withApi(async id => {
    const admin = requireAdmin(request);
    const { bookingId } = await ctx.params;
    const body = await readJsonObject(request);
    rejectUnexpectedKeys(body, ["decision"]);
    const decision = requiredString(body.decision, "decision", 20);
    if (!new Set(["approve", "decline"]).has(decision)) throw new ApiError(422, "INVALID_DECISION", "Choose approve or decline.");
    const db = getD1();
    const pending = await db.prepare(`SELECT id,requested_start_at AS startsAt,requested_end_at AS endsAt FROM reschedule_requests WHERE booking_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1`).bind(bookingId).first<RequestRow>();
    if (!pending) throw new ApiError(409, "NO_PENDING_REQUEST", "There is no pending reschedule request.");
    const booking = await db.prepare(`SELECT b.public_reference AS publicReference,b.confirmed_start_at AS startsAt,b.confirmed_end_at AS endsAt,b.booking_notes AS notes,c.full_name AS clientName,c.email AS clientEmail,c.phone AS clientPhone,s.name AS serviceName,s.audience FROM bookings b JOIN clients c ON c.id=b.client_id JOIN services s ON s.id=b.service_id WHERE b.id=? AND b.status='confirmed'`).bind(bookingId).first<Booking>();
    if (!booking) throw new ApiError(409, "APPOINTMENT_NOT_CONFIRMED", "This appointment is no longer active.");
    const now = Date.now();
    if (decision === "approve") {
      const conflict = await db.prepare(`SELECT id FROM bookings WHERE id<>? AND status='confirmed' AND confirmed_start_at<? AND confirmed_end_at>? LIMIT 1`).bind(bookingId, pending.endsAt, pending.startsAt).first();
      if (conflict) throw new ApiError(409, "APPOINTMENT_CONFLICT", "The requested time now conflicts with another appointment.");
      await db.batch([
        db.prepare(`UPDATE bookings SET confirmed_start_at=?,confirmed_end_at=?,updated_at=? WHERE id=? AND status='confirmed'`).bind(pending.startsAt, pending.endsAt, now, bookingId),
        db.prepare(`UPDATE booking_holds SET starts_at=?,ends_at=? WHERE booking_id=? AND active=1 AND kind='confirmed'`).bind(pending.startsAt, pending.endsAt, bookingId),
        db.prepare(`UPDATE reschedule_requests SET status='approved',reviewed_by=?,reviewed_at=? WHERE id=? AND status='pending'`).bind(admin, now, pending.id),
        db.prepare(`INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_type,actor_id,metadata,created_at) VALUES(?,?,'confirmed','confirmed','admin',?,'{"action":"approve_reschedule"}',?)`).bind(crypto.randomUUID(), bookingId, admin, now),
      ]);
    } else {
      await db.batch([
        db.prepare(`UPDATE reschedule_requests SET status='declined',reviewed_by=?,reviewed_at=? WHERE id=? AND status='pending'`).bind(admin, now, pending.id),
        db.prepare(`INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_type,actor_id,metadata,created_at) VALUES(?,?,'confirmed','confirmed','admin',?,'{"action":"decline_reschedule"}',?)`).bind(crypto.randomUUID(), bookingId, admin, now),
      ]);
    }
    const startsAt = decision === "approve" ? pending.startsAt : booking.startsAt;
    const endsAt = decision === "approve" ? pending.endsAt : booking.endsAt;
    const emailDelivery = await deliverAppointmentEmails(db, decision === "approve" ? "reschedule_approved" : "reschedule_declined", { bookingId, publicReference: booking.publicReference, clientName: booking.clientName, clientEmail: booking.clientEmail, clientPhone: booking.clientPhone, serviceName: booking.serviceName, audience: booking.audience, startsAt, endsAt, notes: booking.notes });
    return dataResponse({ decision, emailDelivery }, 200, id);
  });
}
