import { requireAdmin } from "@/lib/server/admin-auth";
import { sendAppointmentCancellationEmail } from "@/lib/server/event-cancellation-email";
import { ApiError, dataResponse, readJsonObject, rejectUnexpectedKeys, withApi } from "@/lib/server/http";
import { getD1, getEventEmailConfig } from "@/lib/server/runtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string; rsvpId: string }> },
) {
  return withApi(async requestId => {
    requireAdmin(request);
    rejectUnexpectedKeys(await readJsonObject(request), []);

    const { eventId, rsvpId } = await params;
    const db = getD1();
    const row = await db
      .prepare(
        `SELECT
          r.id,
          r.status,
          r.primary_guest_name primaryGuestName,
          r.email,
          e.title eventTitle,
          e.timezone,
          s.starts_at appointmentStartsAt,
          s.ends_at appointmentEndsAt,
          s.label appointmentLabel
        FROM event_rsvps r
        JOIN events e ON e.id=r.event_id
        LEFT JOIN event_appointment_slots s ON s.event_id=r.event_id AND s.rsvp_id=r.id
        WHERE r.id=? AND r.event_id=?`,
      )
      .bind(rsvpId, eventId)
      .first<{
        id: string;
        status: string;
        primaryGuestName: string;
        email: string;
        eventTitle: string;
        timezone: string;
        appointmentStartsAt: number | null;
        appointmentEndsAt: number | null;
        appointmentLabel: string | null;
      }>();

    if (!row) throw new ApiError(404, "RSVP_NOT_FOUND", "RSVP not found.");
    if (!row.appointmentStartsAt || !row.appointmentEndsAt) {
      throw new ApiError(409, "NO_APPOINTMENT", "This RSVP does not have an appointment to cancel.");
    }
    if (row.status === "cancelled") {
      throw new ApiError(409, "RSVP_ALREADY_CANCELLED", "This appointment is already cancelled.");
    }

    const now = Date.now();
    await db.batch([
      db
        .prepare("UPDATE event_appointment_slots SET rsvp_id=NULL WHERE event_id=? AND rsvp_id=?")
        .bind(eventId, rsvpId),
      db
        .prepare("UPDATE event_rsvps SET status='cancelled',updated_at=? WHERE id=? AND event_id=?")
        .bind(now, rsvpId, eventId),
    ]);

    let emailSent = false;
    let emailWarning = "";
    const emailConfig = getEventEmailConfig();

    if (!emailConfig) {
      emailWarning = "Appointment was cancelled, but confirmation email is not configured.";
    } else {
      try {
        await sendAppointmentCancellationEmail(emailConfig, {
          to: row.email,
          guestName: row.primaryGuestName,
          eventTitle: row.eventTitle,
          timezone: row.timezone || "America/Boise",
          appointmentStartsAt: row.appointmentStartsAt,
          appointmentEndsAt: row.appointmentEndsAt,
          appointmentLabel: row.appointmentLabel,
        });
        emailSent = true;
      } catch (error) {
        console.error("Appointment cancellation email failed", error);
        emailWarning = "Appointment was cancelled, but the client email could not be sent.";
      }
    }

    return dataResponse(
      {
        cancelled: true,
        emailSent,
        warning: emailWarning || null,
      },
      200,
      requestId,
    );
  });
}
