import { deliverAppointmentEmails } from "@/lib/server/appointment-email-delivery";
import { ApiError, dataResponse, optionalString, readJsonObject, rejectUnexpectedKeys, requiredString, validation, withApi } from "@/lib/server/http";
import { requireManageAccess } from "@/lib/server/profile-access";
import { getD1 } from "@/lib/server/runtime";

type Params = { params: Promise<{ token: string }> };
type Booking = { status: string; publicReference: string; startsAt: number; endsAt: number; clientName: string; clientEmail: string; clientPhone: string; serviceName: string; audience: "women" | "men"; notes: string | null };

export async function POST(request: Request, ctx: Params) {
  return withApi(async id => {
    const { token } = await ctx.params;
    const access = await requireManageAccess(token);
    const body = await readJsonObject(request);
    rejectUnexpectedKeys(body, ["requestedStartAt", "note"]);
    const raw = requiredString(body.requestedStartAt, "requestedStartAt", 40);
    const start = Date.parse(raw);
    if (!Number.isFinite(start) || start <= Date.now()) throw validation("requestedStartAt", "Choose a future appointment time.");
    const note = optionalString(body.note, "note", 1000);
    const db = getD1();
    const booking = await db.prepare(`SELECT b.status,b.public_reference AS publicReference,b.confirmed_start_at AS startsAt,b.confirmed_end_at AS endsAt,b.booking_notes AS notes,c.full_name AS clientName,c.email AS clientEmail,c.phone AS clientPhone,s.name AS serviceName,s.audience FROM bookings b JOIN clients c ON c.id=b.client_id JOIN services s ON s.id=b.service_id WHERE b.id=?`).bind(access.bookingId).first<Booking>();
    if (!booking || booking.status !== "confirmed") throw new ApiError(409, "APPOINTMENT_NOT_CONFIRMED", "This appointment can no longer be rescheduled.");
    const end = start + booking.endsAt - booking.startsAt;
    const now = Date.now();
    await db.batch([
      db.prepare(`UPDATE reschedule_requests SET status='declined',reviewed_at=? WHERE booking_id=? AND status='pending'`).bind(now, access.bookingId),
      db.prepare(`INSERT INTO reschedule_requests(id,booking_id,requested_start_at,requested_end_at,note,status,created_at) VALUES(?,?,?,?,?,'pending',?)`).bind(crypto.randomUUID(), access.bookingId, start, end, note, now),
      db.prepare(`INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_type,reason,metadata,created_at) VALUES(?,?,'confirmed','confirmed','client',?,?,?)`).bind(crypto.randomUUID(), access.bookingId, note, JSON.stringify({ action: "request_reschedule", requestedStartAt: new Date(start).toISOString() }), now),
    ]);
    const emailDelivery = await deliverAppointmentEmails(db, "client_reschedule_requested", { bookingId: access.bookingId, publicReference: booking.publicReference, clientName: booking.clientName, clientEmail: booking.clientEmail, clientPhone: booking.clientPhone, serviceName: booking.serviceName, audience: booking.audience, startsAt: start, endsAt: end, notes: note });
    return dataResponse({ message: "Request received. Your current appointment remains confirmed until Kayla approves the new time.", emailDelivery }, 201, id);
  });
}
