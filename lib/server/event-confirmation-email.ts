import {
  buildEventConfirmationEmailHtml,
  buildEventConfirmationEmailText,
  confirmationUtcStamp,
  type ConfirmationEmailInput,
} from "@/lib/server/event-confirmation-template";

type EmailRuntimeConfig = {
  apiKey: string;
  from: string;
  replyTo: string;
};

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
    `DTSTAMP:${confirmationUtcStamp(Date.now())}`,
    `DTSTART:${confirmationUtcStamp(startsAt)}`,
    `DTEND:${confirmationUtcStamp(endsAt)}`,
    `SUMMARY:${icsEscape(input.eventTitle)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(input.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
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
      subject: `${input.appointmentStartsAt ? "You’re booked" : "You’re confirmed"}: ${input.eventTitle}`,
      html: buildEventConfirmationEmailHtml(input),
      text: buildEventConfirmationEmailText(input),
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
