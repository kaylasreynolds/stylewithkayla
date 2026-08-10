import { formatConfirmationDate, formatConfirmationTime } from "@/lib/server/event-confirmation-template";

type EmailRuntimeConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  mailbox: string;
  replyTo: string;
};

export type AppointmentCancellationEmailInput = {
  to: string;
  guestName: string;
  eventTitle: string;
  timezone: string;
  appointmentStartsAt: number;
  appointmentEndsAt: number;
  appointmentLabel?: string | null;
};

type MicrosoftTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

const htmlEscape = (value: string) =>
  value.replace(/[&<>"']/g, character =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character] ?? character,
  );

async function getMicrosoftAccessToken(config: EmailRuntimeConfig) {
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

function buildCancellationHtml(input: AppointmentCancellationEmailInput) {
  const date = formatConfirmationDate(input.appointmentStartsAt, input.timezone);
  const time = input.appointmentLabel || `${formatConfirmationTime(input.appointmentStartsAt, input.timezone)}–${formatConfirmationTime(input.appointmentEndsAt, input.timezone)}`;
  const logoUrl = "https://stylewithkayla.com/images/stylewithkayla_logo_white_transparent.png";
  const signatureUrl = "https://stylewithkayla.com/images/heart-name-pink.png";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4efeb;color:#151312;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4efeb;padding:24px 12px 40px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="width:620px;max-width:620px;background:#fffdfb;border:1px solid #ded4ce;text-align:center;">
        <tr><td align="center" style="padding:6px 18px;background:#111111;"><img src="${logoUrl}" width="190" alt="Style with Kayla" style="display:block;width:190px;max-width:70%;height:auto;margin:0 auto;border:0;"></td></tr>
        <tr><td style="padding:38px 30px 10px;">
          <p style="margin:0 0 12px;color:#cf647e;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Appointment cancelled</p>
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:500;line-height:1.15;">Your appointment has been cancelled</h1>
        </td></tr>
        <tr><td style="padding:24px 34px 26px;font-size:15px;line-height:1.65;">
          <p style="margin:0 0 18px;">Hi ${htmlEscape(input.guestName)},</p>
          <p style="margin:0;">Your appointment for <strong>${htmlEscape(input.eventTitle)}</strong> has been cancelled.</p>
        </td></tr>
        <tr><td style="padding:0 28px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #eaded8;border-radius:14px;background:#fffaf8;text-align:left;">
            <tr><td width="34%" style="padding:18px 20px;color:#b94d68;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #eaded8;">Event</td><td style="padding:18px 20px;border-left:1px solid #eaded8;border-bottom:1px solid #eaded8;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;">${htmlEscape(input.eventTitle)}</td></tr>
            <tr><td width="34%" style="padding:18px 20px;color:#b94d68;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #eaded8;">Date</td><td style="padding:18px 20px;border-left:1px solid #eaded8;border-bottom:1px solid #eaded8;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;">${htmlEscape(date)}</td></tr>
            <tr><td width="34%" style="padding:18px 20px;color:#b94d68;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">Time</td><td style="padding:18px 20px;border-left:1px solid #eaded8;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;">${htmlEscape(time)}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 34px 30px;font-size:14px;line-height:1.65;">
          <p style="margin:0;">If you’d like to reschedule or have any questions, just reply to this email and I’ll be happy to help.</p>
          <img src="${signatureUrl}" width="250" alt="xo, Kayla" style="display:block;width:250px;max-width:80%;height:auto;margin:22px auto 0;border:0;">
        </td></tr>
        <tr><td style="padding:20px 22px;background:#111;color:#fff;font-size:12px;line-height:1.6;">
          <a href="mailto:kayla@stylewithkayla.com" style="color:#fff;text-decoration:none;">kayla@stylewithkayla.com</a> &nbsp;|&nbsp; <a href="https://stylewithkayla.com" style="color:#fff;text-decoration:none;">stylewithkayla.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendAppointmentCancellationEmail(
  config: EmailRuntimeConfig,
  input: AppointmentCancellationEmailInput,
) {
  const accessToken = await getMicrosoftAccessToken(config);
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
          subject: `Appointment cancelled: ${input.eventTitle}`,
          body: { contentType: "HTML", content: buildCancellationHtml(input) },
          toRecipients: [{ emailAddress: { address: input.to } }],
          replyTo: [{ emailAddress: { address: config.replyTo } }],
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Microsoft cancellation email failed (${response.status}): ${detail.slice(0, 700)}`);
  }
}
