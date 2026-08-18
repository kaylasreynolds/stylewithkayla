import { appointmentIcs, formatAppointment } from "@/lib/appointment/presentation";
import { renderBookingConfirmationEmail } from "@/lib/server/booking-confirmation-email";
import { getAppointmentEmailConfig } from "@/lib/server/runtime";

type DeliveryKind =
  | "request_received"
  | "confirmed"
  | "alternate_time_proposed"
  | "proposal_accepted"
  | "another_time_requested"
  | "declined"
  | "client_reschedule_requested"
  | "reschedule_approved"
  | "reschedule_declined"
  | "client_cancelled"
  | "admin_cancelled";

export type AppointmentDelivery = {
  bookingId: string;
  publicReference: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  serviceName: string;
  audience: "women" | "men";
  startsAt: number;
  endsAt: number;
  notes?: string | null;
  reason?: string | null;
  actionUrl?: string | null;
  profileUrl?: string | null;
  manageUrl?: string | null;
  calendarUrl?: string | null;
  previousStartsAt?: number | null;
};

type Message = {
  templateKey: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  calendar?: string;
};

type MailConfig = NonNullable<ReturnType<typeof getAppointmentEmailConfig>>;

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
const firstName = (value: string) => value.trim().split(/\s+/)[0] || "there";

function shell(title: string, greeting: string, paragraphs: string[], action?: { label: string; url: string } | null) {
  const content = paragraphs.map(paragraph => `<p style="margin:0 0 16px;line-height:1.65;">${paragraph}</p>`).join("");
  const button = action ? `<p style="margin:26px 0 8px;"><a href="${escape(action.url)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#b94464;color:#fff;text-decoration:none;font-weight:700;">${escape(action.label)}</a></p>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f4efeb;color:#171515;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:#f4efeb;"><tr><td align="center"><table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffdfb;border:1px solid #eaded8;"><tr><td align="center" style="padding:24px;background:#050505;color:#fff;font-family:Georgia,serif;font-size:25px;letter-spacing:.14em;">STYLE WITH KAYLA</td></tr><tr><td style="padding:38px 34px;"><p style="margin:0 0 10px;color:#b94464;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">Appointment update</p><h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:36px;font-weight:500;">${escape(title)}</h1><p style="margin:0 0 16px;line-height:1.65;">${escape(greeting)}</p>${content}${button}</td></tr><tr><td style="padding:20px;background:#050505;color:#fff;text-align:center;font-size:12px;">STYLE WITH KAYLA · PERSONAL STYLIST AT MACY’S</td></tr></table></td></tr></table></body></html>`;
}

function appointmentLine(input: AppointmentDelivery) {
  const value = formatAppointment(input.startsAt, input.endsAt);
  return `${value.date}, ${value.time}`;
}

function clientMessage(input: AppointmentDelivery, title: string, paragraphs: string[], action?: { label: string; url: string } | null, templateKey = "appointment_update"): Message {
  const text = [`Hi ${firstName(input.clientName)},`, "", ...paragraphs.map(value => value.replace(/<[^>]+>/g, "")), action ? `${action.label}: ${action.url}` : "", "", "— Kayla"].filter(Boolean).join("\n");
  return { templateKey, to: input.clientEmail, subject: title, html: shell(title, `Hi ${firstName(input.clientName)},`, paragraphs, action), text };
}

function adminMessage(config: MailConfig, input: AppointmentDelivery, title: string, paragraphs: string[], templateKey: string): Message {
  return { templateKey, to: config.notificationTo, subject: `${title} · ${input.publicReference}`, html: shell(title, "Kayla,", paragraphs), text: [title, input.publicReference, ...paragraphs.map(value => value.replace(/<[^>]+>/g, ""))].join("\n") };
}

function messages(config: MailConfig, kind: DeliveryKind, input: AppointmentDelivery): Message[] {
  const when = appointmentLine(input);
  const details = `<strong>${escape(input.serviceName)}</strong><br>${escape(when)}`;
  if (kind === "request_received") return [
    clientMessage(input, "We received your appointment request", ["Your request has been received and the time is being held while Kayla reviews it. Your appointment is not confirmed yet.", details], null, "booking_request_received"),
    adminMessage(config, input, "New appointment request", [details, `Client: ${escape(input.clientName)} · ${escape(input.clientEmail)}${input.clientPhone ? ` · ${escape(input.clientPhone)}` : ""}`, input.notes ? `Notes: ${escape(input.notes)}` : ""].filter(Boolean), "booking_request_admin_notification"),
  ];
  if (kind === "confirmed" || kind === "proposal_accepted") {
    const profileUrl = input.profileUrl!, manageUrl = input.manageUrl!, calendarUrl = input.calendarUrl!;
    const customer: Message = {
      templateKey: "booking_confirmed",
      to: input.clientEmail,
      subject: `You’re booked: ${input.serviceName}`,
      html: renderBookingConfirmationEmail({ firstName: firstName(input.clientName), serviceName: input.serviceName, audience: input.audience, startsAt: input.startsAt, endsAt: input.endsAt, profileUrl, manageUrl, calendarUrl }),
      text: [`Hi ${firstName(input.clientName)},`, "", `Your ${input.serviceName} appointment is confirmed for ${when}.`, `Complete Style Profile: ${profileUrl}`, `Manage Appointment: ${manageUrl}`, `Add to Calendar: ${calendarUrl}`, "", "— Kayla"].join("\n"),
      calendar: appointmentIcs({ startsAt: input.startsAt, endsAt: input.endsAt, serviceName: input.serviceName, uid: `${input.bookingId}@stylewithkayla.com`, organizer: config.mailbox, attendees: [input.clientEmail, config.notificationTo], method: "REQUEST" }),
    };
    return kind === "proposal_accepted" ? [customer, adminMessage(config, input, "Client accepted proposed appointment time", [details, `Client: ${escape(input.clientName)}`], "proposal_accepted_admin_notification")] : [customer];
  }
  if (kind === "alternate_time_proposed") return [clientMessage(input, "Kayla proposed a different appointment time", [`A different time is available for your ${escape(input.serviceName)} appointment.`, details], input.actionUrl ? { label: "Review proposed time", url: input.actionUrl } : null, "alternate_time_proposed")];
  if (kind === "another_time_requested") return [
    clientMessage(input, "We received your new time request", ["Your new requested time is being held while Kayla reviews it. This is not confirmed yet.", details], null, "alternate_time_requested"),
    adminMessage(config, input, "Client requested another appointment time", [details, `Client: ${escape(input.clientName)}`], "alternate_time_requested_admin_notification"),
  ];
  if (kind === "declined") return [clientMessage(input, "Appointment request update", [input.reason ? escape(input.reason).replace(/\n/g, "<br>") : "Kayla is unable to accommodate this appointment request. The time has been released."], null, "booking_declined")];
  if (kind === "client_reschedule_requested") return [
    clientMessage(input, "Your reschedule request was received", ["Your current appointment remains confirmed until Kayla approves a replacement time.", `Requested replacement: ${escape(when)}`], null, "reschedule_requested"),
    adminMessage(config, input, "Client requested a reschedule", [`Requested replacement: ${escape(when)}`, `Client: ${escape(input.clientName)}`, input.notes ? `Note: ${escape(input.notes)}` : ""].filter(Boolean), "reschedule_requested_admin_notification"),
  ];
  if (kind === "reschedule_approved") {
    const customer = clientMessage(input, "Your new appointment time is confirmed", [`Your ${escape(input.serviceName)} appointment has been moved and is now confirmed for:`, details], null, "reschedule_approved");
    customer.calendar = appointmentIcs({ startsAt: input.startsAt, endsAt: input.endsAt, serviceName: input.serviceName, uid: `${input.bookingId}@stylewithkayla.com`, organizer: config.mailbox, attendees: [input.clientEmail, config.notificationTo], method: "REQUEST" });
    return [customer];
  }
  if (kind === "reschedule_declined") return [clientMessage(input, "Your current appointment time is unchanged", [`Kayla was unable to approve the requested replacement time. Your current ${escape(input.serviceName)} appointment remains confirmed for:`, details], null, "reschedule_declined")];
  if (kind === "client_cancelled") return [
    clientMessage(input, "Your appointment has been cancelled", [`Your ${escape(input.serviceName)} appointment for ${escape(when)} has been cancelled and the time has been released.`], null, "booking_cancelled"),
    adminMessage(config, input, "Client cancelled an appointment", [details, `Client: ${escape(input.clientName)}`, input.reason ? `Reason: ${escape(input.reason)}` : ""].filter(Boolean), "booking_cancelled_admin_notification"),
  ];
  return [clientMessage(input, "Your appointment has been cancelled", [`Your ${escape(input.serviceName)} appointment for ${escape(when)} has been cancelled and the time has been released.`, input.reason ? `Message from Kayla: ${escape(input.reason)}` : ""].filter(Boolean), null, "booking_cancelled")];
}

async function accessToken(config: MailConfig) {
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }) });
  const payload = await response.json() as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !payload.access_token) throw new Error(`Microsoft authentication failed (${response.status}): ${payload.error_description || payload.error || "No access token returned."}`);
  return payload.access_token;
}

const base64 = (value: string) => {
  const bytes = new TextEncoder().encode(value); let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

async function send(config: MailConfig, token: string, message: Message) {
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailbox)}/sendMail`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { subject: message.subject, body: { contentType: "HTML", content: message.html }, toRecipients: [{ emailAddress: { address: message.to } }], replyTo: [{ emailAddress: { address: config.replyTo } }], attachments: message.calendar ? [{ "@odata.type": "#microsoft.graph.fileAttachment", name: "style-with-kayla-appointment.ics", contentType: "text/calendar; method=REQUEST; charset=UTF-8", contentBytes: base64(message.calendar) }] : [] }, saveToSentItems: true }) });
  if (!response.ok) throw new Error(`Microsoft appointment email failed (${response.status}): ${(await response.text()).slice(0, 700)}`);
}

export async function deliverAppointmentEmails(db: D1Database, kind: DeliveryKind, input: AppointmentDelivery) {
  const config = getAppointmentEmailConfig();
  const pending = config ? messages(config, kind, input) : [{ templateKey: kind, to: input.clientEmail, subject: "", html: "", text: "" }];
  const ids = pending.map(() => crypto.randomUUID());
  await db.batch(pending.map((message, index) => db.prepare(`INSERT INTO communications(id,booking_id,channel,template_key,recipient,status,metadata,created_at) VALUES(?,?, 'email',?,?,'queued',?,?)`).bind(ids[index], input.bookingId, message.templateKey, message.to, JSON.stringify({ deliveryDeferred: false }), Date.now())));
  if (!config) {
    await db.batch(ids.map(id => db.prepare(`UPDATE communications SET status='failed',error_message=? WHERE id=?`).bind("Microsoft appointment email is not configured.", id)));
    return { sent: 0, failed: ids.length, warning: "Appointment email is not configured." };
  }
  let token: string;
  try { token = await accessToken(config); }
  catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    await db.batch(ids.map(id => db.prepare(`UPDATE communications SET status='failed',error_message=? WHERE id=?`).bind(detail.slice(0, 1000), id)));
    console.error("Appointment email authentication failed", { bookingId: input.bookingId, kind, error: detail });
    return { sent: 0, failed: ids.length, warning: "Appointment email delivery failed." };
  }
  let sent = 0, failed = 0;
  for (let index = 0; index < pending.length; index += 1) {
    try { await send(config, token, pending[index]); await db.prepare(`UPDATE communications SET status='sent',sent_at=?,error_message=NULL WHERE id=?`).bind(Date.now(), ids[index]).run(); sent += 1; }
    catch (error) { const detail = error instanceof Error ? error.message : String(error); await db.prepare(`UPDATE communications SET status='failed',error_message=? WHERE id=?`).bind(detail.slice(0, 1000), ids[index]).run(); console.error("Appointment email failed", { bookingId: input.bookingId, kind, recipient: pending[index].to, error: detail }); failed += 1; }
  }
  return { sent, failed, warning: failed ? "One or more appointment emails could not be sent." : null };
}
