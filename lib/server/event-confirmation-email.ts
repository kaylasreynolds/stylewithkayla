import {
  buildEventConfirmationEmailHtml,
  confirmationUtcStamp,
  type ConfirmationEmailInput,
} from "@/lib/server/event-confirmation-template";

type EmailRuntimeConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  mailbox: string;
  replyTo: string;
};

type MicrosoftTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
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

async function getMicrosoftAccessToken(config: EmailRuntimeConfig) {
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  const token = (await tokenResponse.json()) as MicrosoftTokenResponse;

  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(
      `Microsoft authentication failed (${tokenResponse.status}): ${
        token.error_description || token.error || "No access token returned."
      }`,
    );
  }

  return token.access_token;
}

export async function sendEventConfirmationEmail(
  config: EmailRuntimeConfig,
  input: ConfirmationEmailInput,
) {
  const accessToken = await getMicrosoftAccessToken(config);
  const calendar = buildCalendarFile(input);

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.mailbox)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: `${input.appointmentStartsAt ? "You’re booked" : "You’re confirmed"}: ${input.eventTitle}`,
          body: {
            contentType: "HTML",
            content: buildEventConfirmationEmailHtml(input),
          },
          toRecipients: [
            {
              emailAddress: {
                address: input.to,
              },
            },
          ],
          replyTo: [
            {
              emailAddress: {
                address: config.replyTo,
              },
            },
          ],
          attachments: [
            {
              "@odata.type": "#microsoft.graph.fileAttachment",
              name: "style-with-kayla-appointment.ics",
              contentType: "text/calendar; method=PUBLISH; charset=UTF-8",
              contentBytes: toBase64(calendar),
            },
          ],
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Microsoft confirmation email failed (${response.status}): ${detail.slice(0, 700)}`,
    );
  }
}
