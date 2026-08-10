export type ConfirmationEmailInput = {
  to: string;
  guestName: string;
  eventTitle: string;
  eventStartsAt: number;
  eventEndsAt: number;
  timezone: string;
  location: string;
  eventOffer?: string | null;
  appointmentStartsAt?: number | null;
  appointmentEndsAt?: number | null;
  appointmentLabel?: string | null;
  notes?: string | null;
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

export const formatConfirmationDate = (value: number, timezone: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));

export const formatConfirmationTime = (value: number, timezone: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));

export const confirmationUtcStamp = (value: number) =>
  new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export const buildGoogleCalendarUrl = (input: ConfirmationEmailInput) => {
  const startsAt = input.appointmentStartsAt ?? input.eventStartsAt;
  const endsAt = input.appointmentEndsAt ?? input.eventEndsAt;
  const details = input.appointmentStartsAt
    ? `Appointment for ${input.eventTitle}`
    : input.eventTitle;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.eventTitle,
    dates: `${confirmationUtcStamp(startsAt)}/${confirmationUtcStamp(endsAt)}`,
    details,
    location: input.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const buildEventConfirmationEmailHtml = (input: ConfirmationEmailInput) => {
  const scheduledStartsAt = input.appointmentStartsAt ?? input.eventStartsAt;
  const scheduledEndsAt = input.appointmentEndsAt ?? input.eventEndsAt;
  const date = formatConfirmationDate(scheduledStartsAt, input.timezone);
  const time = input.appointmentLabel || `${formatConfirmationTime(scheduledStartsAt, input.timezone)}–${formatConfirmationTime(scheduledEndsAt, input.timezone)}`;
  const status = input.appointmentStartsAt ? "Your appointment is confirmed" : "Your RSVP is confirmed";
  const introEnd = input.appointmentStartsAt
    ? "Your appointment is set, and all of the details are right here."
    : "Your spot is saved, and all of the details are right here.";
  const calendarUrl = buildGoogleCalendarUrl(input);
  const logoUrl = "https://stylewithkayla.com/images/stylewithkayla_logo_white_transparent.png";
  const signatureUrl = "https://stylewithkayla.com/images/heart-name-pink.png";

  const detailRow = (label: string, value: string, rose = false) => `
    <tr>
      <td width="34%" valign="middle" style="padding:18px 18px 18px 20px;border-bottom:1px solid #eaded8;color:#b94d68;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:.12em;line-height:1.35;text-transform:uppercase;">${label}</td>
      <td valign="middle" style="padding:18px 20px 18px 22px;border-left:1px solid #eaded8;border-bottom:1px solid #eaded8;color:${rose ? "#cf647e" : "#251f1c"};font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:21px;font-weight:600;line-height:1.2;">${value}</td>
    </tr>`;

  const divider = `
    <table role="presentation" width="170" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td style="height:0;font-size:0;line-height:0;border-top:1px solid #f0d8de;">&nbsp;</td>
        <td width="22" align="center" style="color:#e6a7b7;font-size:14px;line-height:1;">◇</td>
        <td style="height:0;font-size:0;line-height:0;border-top:1px solid #f0d8de;">&nbsp;</td>
      </tr>
    </table>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Corinthia:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&family=WindSong:wght@400;500&display=swap');
    @media only screen and (max-width:520px){
      .email-wrap{padding:10px 8px 24px!important}.email-card{width:100%!important}.brand{padding:5px 14px!important}.brand img{width:176px!important}.hero{padding:28px 18px 8px!important}.thank{font-size:56px!important}.status{font-size:11px!important}.intro{padding:24px 20px!important}.intro-copy{font-size:14px!important}.intro-title{font-size:26px!important}.content-pad{padding-left:14px!important;padding-right:14px!important}.calendar-btn{display:block!important;width:auto!important;padding:17px 18px!important;font-size:14px!important}.closing{padding:0 18px 30px!important}.signature-img{width:250px!important;max-width:84%!important}.help{padding:20px 18px!important}.footer{padding:18px 14px 20px!important}.footer-links{font-size:11px!important}}
  </style>
</head>
<body style="margin:0;background:#f4efeb;color:#151312;font-family:'Inter',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrap" style="width:100%;background:#f4efeb;padding:24px 12px 40px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" class="email-card" style="width:620px;max-width:620px;background:#fffdfb;border:1px solid #ded4ce;overflow:hidden;text-align:center;">
        <tr><td align="center" class="brand" style="padding:6px 18px;background:#111111;"><img src="${logoUrl}" width="190" alt="Style with Kayla" style="display:block;width:190px;max-width:70%;height:auto;margin:0 auto;border:0;"></td></tr>

        <tr><td align="center" class="hero" style="padding:34px 28px 10px;">
          <div class="thank" style="margin:0 0 24px;color:#111;font-family:'WindSong','Snell Roundhand','Segoe Script',cursive;font-size:68px;font-weight:500;line-height:1;">Thank you!</div>
          <div class="status" style="margin:0;color:#cf647e;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">${htmlEscape(status)}</div>
        </td></tr>

        <tr><td align="center" class="intro" style="padding:28px 34px;">
          <p class="intro-copy" style="margin:0;font-size:15px;line-height:1.6;">I’m so excited you’ll be joining me for the</p>
          <p class="intro-title" style="margin:12px 0 11px;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:29px;font-weight:600;line-height:1.12;">${htmlEscape(input.eventTitle)}</p>
          <p class="intro-copy" style="margin:0;font-size:15px;line-height:1.6;">${htmlEscape(introEnd)}</p>
        </td></tr>

        <tr><td align="center" style="padding:0 0 28px;">${divider}</td></tr>

        <tr><td class="content-pad" style="padding:0 28px 26px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #eaded8;border-radius:14px;background:#fffaf8;text-align:left;border-collapse:separate;border-spacing:0;overflow:hidden;">
            ${detailRow("Event", htmlEscape(input.eventTitle))}
            ${detailRow("Date", htmlEscape(date))}
            ${detailRow(input.appointmentStartsAt ? "Your appointment" : "Time", htmlEscape(time), Boolean(input.appointmentStartsAt))}
            <tr>
              <td width="34%" valign="middle" style="padding:18px 18px 18px 20px;color:#b94d68;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:.12em;line-height:1.35;text-transform:uppercase;">Location</td>
              <td valign="middle" style="padding:18px 20px 18px 22px;border-left:1px solid #eaded8;color:#251f1c;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;line-height:1.32;">${htmlEscape(input.location)}</td>
            </tr>
          </table>
        </td></tr>

        ${input.eventOffer ? `<tr><td class="content-pad" style="padding:0 28px 28px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f7e7e5;border-radius:14px;"><tr><td width="84" align="center" style="padding:18px 8px;color:#cf647e;font-size:34px;">♡</td><td style="padding:18px 20px 18px 4px;text-align:left;"><p style="margin:0 0 6px;color:#b94d68;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">Appointment perk:</p><p style="margin:0;color:#151312;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;">${htmlEscape(input.eventOffer)}</p></td></tr></table></td></tr>` : ""}

        ${input.notes ? `<tr><td class="content-pad" style="padding:0 28px 24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#fffaf8;border:1px solid #eaded8;border-radius:12px;"><tr><td style="padding:16px 18px;text-align:left;"><p style="margin:0 0 5px;color:#b94d68;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Your notes</p><p style="margin:0;font-size:13px;line-height:1.55;">${htmlEscape(input.notes)}</p></td></tr></table></td></tr>` : ""}

        <tr><td align="center" class="content-pad" style="padding:4px 28px 26px;">
          <a href="${htmlEscape(calendarUrl)}" class="calendar-btn" style="display:inline-block;min-width:330px;padding:18px 34px;background:#111;color:#fff;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;letter-spacing:.15em;text-decoration:none;text-transform:uppercase;">Add to Calendar</a>
          <p style="max-width:390px;margin:11px auto 0;color:#6c625d;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:9px;line-height:1.45;">A calendar file is also attached to this email for easy saving and reminders.</p>
        </td></tr>

        <tr><td align="center" style="padding:0 0 24px;">${divider.replace('width="170"', 'width="250"')}</td></tr>

        <tr><td align="center" class="closing" style="padding:0 28px 32px;">
          <p style="margin:0;font-size:15px;">I’ll see you there!</p>
          <img class="signature-img" src="${signatureUrl}" width="270" alt="xo, Kayla" style="display:block;width:270px;max-width:82%;height:auto;margin:20px auto 0;border:0;color:#cf647e;font-family:'Corinthia','Snell Roundhand','Segoe Script',cursive;font-size:64px;line-height:1;">
        </td></tr>

        <tr><td class="help" style="padding:22px 28px;border-top:1px solid #eaded8;background:#fbf3ef;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="58" align="center" valign="middle" style="color:#cf647e;font-size:24px;">✉</td><td valign="middle" style="text-align:left;color:#151312;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;"><strong style="display:block;margin-bottom:2px;">Questions or changes?</strong>Reply to this email or contact me at <a href="mailto:kayla.reynolds@macys.com" style="color:#b94d68;font-weight:700;text-decoration:none;">kayla.reynolds@macys.com</a>.</td></tr></table>
        </td></tr>

        <tr><td align="center" class="footer" style="padding:20px 22px 22px;background:#111;color:#fff;">
          <p style="margin:0 0 12px;color:#e4dfdc;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.22em;text-transform:uppercase;">Connect with me</p>
          <p class="footer-links" style="margin:0;color:#fff;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">Instagram &nbsp;|&nbsp; Facebook &nbsp;|&nbsp; <a href="mailto:kayla.reynolds@macys.com" style="color:#fff;text-decoration:none;">Email</a> &nbsp;|&nbsp; <a href="https://stylewithkayla.com" style="color:#fff;text-decoration:none;">Style with Kayla</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

export const buildEventConfirmationEmailText = (input: ConfirmationEmailInput) => {
  const startsAt = input.appointmentStartsAt ?? input.eventStartsAt;
  const endsAt = input.appointmentEndsAt ?? input.eventEndsAt;
  const date = formatConfirmationDate(startsAt, input.timezone);
  const time = input.appointmentLabel || `${formatConfirmationTime(startsAt, input.timezone)}–${formatConfirmationTime(endsAt, input.timezone)}`;

  return [
    input.appointmentStartsAt ? "Your appointment is confirmed." : "Your RSVP is confirmed.",
    "",
    `I’m so excited you’ll be joining me for the ${input.eventTitle}.`,
    "",
    `Date: ${date}`,
    `${input.appointmentStartsAt ? "Your appointment" : "Time"}: ${time}`,
    `Location: ${input.location}`,
    input.eventOffer ? `Appointment perk: ${input.eventOffer}` : "",
    input.notes ? `Notes: ${input.notes}` : "",
    "",
    `Add to Calendar: ${buildGoogleCalendarUrl(input)}`,
    "A calendar file is also attached to this email.",
    "",
    "I’ll see you there!",
    "xo, Kayla",
    "",
    "Questions or changes? Reply to this email or contact kayla.reynolds@macys.com.",
  ].filter(Boolean).join("\n");
};
