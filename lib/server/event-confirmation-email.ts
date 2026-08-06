type ConfirmationEmailInput = {
  to: string;
  guestName: string;
  eventTitle: string;
  eventStartsAt: number;
  eventEndsAt: number;
  timezone: string;
  location: string;
  appointmentStartsAt?: number | null;
  appointmentEndsAt?: number | null;
  appointmentLabel?: string | null;
  notes?: string | null;
};

type EmailRuntimeConfig = {
  apiKey: string;
  from: string;
  replyTo: string;
};

const htmlEscape = (value: string) =>
  value.replace(/[&<>"']/g, (character) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character] ?? character,
  );

const formatDate = (value: number, timezone: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));

const formatTime = (value: number, timezone: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));

const utcStamp = (value: number) =>
  new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const icsEscape = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const toBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const buildCalendarFile = (input: ConfirmationEmailInput) => {
  const startsAt = input.appointmentStartsAt ?? input.eventStartsAt;
  const endsAt = input.appointmentEndsAt ?? input.eventEndsAt;
  const description = input.appointmentStartsAt
    ? `Appointment for ${input.eventTitle}`
    : input.eventTitle;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Style with Kayla//Event Confirmation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@stylewithkayla.com`,
    `DTSTAMP:${utcStamp(Date.now())}`,
    `DTSTART:${utcStamp(startsAt)}`,
    `DTEND:${utcStamp(endsAt)}`,
    `SUMMARY:${icsEscape(input.eventTitle)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(input.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

const buildEmailHtml = (input: ConfirmationEmailInput) => {
  const scheduledStartsAt = input.appointmentStartsAt ?? input.eventStartsAt;
  const scheduledEndsAt = input.appointmentEndsAt ?? input.eventEndsAt;
  const date = formatDate(scheduledStartsAt, input.timezone);
  const time = `${formatTime(scheduledStartsAt, input.timezone)}–${formatTime(scheduledEndsAt, input.timezone)}`;
  const appointmentText = input.appointmentStartsAt
    ? input.appointmentLabel || time
    : "No appointment time selected";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f2ee;color:#3d3531;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f2ee;padding:28px 14px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffdfb;border:1px solid #ded2ca;border-radius:16px;overflow:hidden;text-align:center;">
          <tr><td align="center" style="padding:34px 34px 14px;text-align:center;">
            <p style="margin:0 0 8px;color:#a85f68;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;text-align:center;">Appointment confirmed</p>
            <h1 style="margin:0;font-family:Georgia,serif;font-size:34px;line-height:1.1;color:#3d3531;text-align:center;">Thanks for booking, ${htmlEscape(input.guestName)}!</h1>
          </td></tr>
          <tr><td align="center" style="padding:10px 34px 22px;text-align:center;">
            <p style="margin:0;font-size:16px;line-height:1.65;text-align:center;">Your spot for <strong>${htmlEscape(input.eventTitle)}</strong> has been saved. I can’t wait to see you there!</p>
          </td></tr>
          <tr><td align="center" style="padding:0 34px 24px;text-align:center;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8efec;border-radius:12px;padding:4px 0;text-align:center;">
              <tr><td align="center" style="padding:18px 20px 8px;color:#a85f68;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;text-align:center;">Event</td></tr>
              <tr><td align="center" style="padding:0 20px 12px;font-size:17px;font-weight:700;text-align:center;">${htmlEscape(input.eventTitle)}</td></tr>
              <tr><td align="center" style="padding:0 20px 8px;font-size:14px;line-height:1.55;text-align:center;"><strong>Date:</strong> ${htmlEscape(date)}</td></tr>
              <tr><td align="center" style="padding:0 20px 8px;font-size:14px;line-height:1.55;text-align:center;"><strong>Time:</strong> ${htmlEscape(appointmentText)}</td></tr>
              <tr><td align="center" style="padding:0 20px 18px;font-size:14px;line-height:1.55;text-align:center;"><strong>Location:</strong> ${htmlEscape(input.location)}</td></tr>
            </table>
          </td></tr>
          ${input.notes ? `<tr><td align="center" style="padding:0 34px 22px;text-align:center;"><p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#a85f68;text-transform:uppercase;letter-spacing:.08em;text-align:center;">Your notes</p><p style="margin:0;font-size:14px;line-height:1.6;text-align:center;">${htmlEscape(input.notes)}</p></td></tr>` : ""}
          <tr><td align="center" style="padding:0 34px 28px;text-align:center;">
            <p style="margin:0;font-size:14px;line-height:1.65;color:#655a55;text-align:center;">A calendar file is attached to this email. Open it to add the appointment to your calendar and receive calendar reminders.</p>
          </td></tr>
          <tr><td align="center" style="padding:22px 34px;background:#3d3531;color:#fff;font-size:13px;line-height:1.6;text-align:center;">
            Questions or changes? Reply to this email or contact Kayla at <a href="mailto:kayla@stylewithkayla.com" style="color:#fff;">kayla@stylewithkayla.com</a>.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

const buildEmailText = (input: ConfirmationEmailInput) => {
  const startsAt = input.appointmentStartsAt ?? input.eventStartsAt;
  const endsAt = input.appointmentEndsAt ?? input.eventEndsAt;
  const date = formatDate(startsAt, input.timezone);
  const time = input.appointmentLabel || `${formatTime(startsAt, input.timezone)}–${formatTime(endsAt, input.timezone)}`;

  return [
    `Thanks for booking, ${input.guestName}!`,
    "",
    `Your spot for ${input.eventTitle} has been saved. I can’t wait to see you there!`,
    "",
    `Date: ${date}`,
    `Time: ${time}`,
    `Location: ${input.location}`,
    input.notes ? `Notes: ${input.notes}` : "",
    "",
    "A calendar file is attached. Open it to add the appointment to your calendar and receive calendar reminders.",
    "",
    "Questions or changes? Reply to this email or contact kayla@stylewithkayla.com.",
  ].filter(Boolean).join("\n");
};

export async function sendEventConfirmationEmail(
  config: EmailRuntimeConfig,
  input: ConfirmationEmailInput,
) {
  const calendar = buildCalendarFile(input);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      reply_to: config.replyTo,
      subject: `You’re booked: ${input.eventTitle}`,
      html: buildEmailHtml(input),
      text: buildEmailText(input),
      attachments: [
        {
          filename: "style-with-kayla-appointment.ics",
          content: toBase64(calendar),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Confirmation email failed (${response.status}): ${detail.slice(0, 500)}`);
  }
}
