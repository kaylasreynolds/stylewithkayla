import { APPOINTMENT_ADDRESS, APPOINTMENT_LOCATION, formatAppointment, locationNote } from "@/lib/appointment/presentation";

export type BookingConfirmationEmailData = {
  firstName: string;
  serviceName: string;
  audience: "women" | "men";
  startsAt: number;
  endsAt: number;
  profileUrl: string;
  manageUrl: string;
  calendarUrl: string;
};

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

function button(label: string, url: string, filled = false) {
  const background = filled ? "#b94464" : "#fffdfb";
  const color = filled ? "#ffffff" : "#ad4563";
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td bgcolor="${background}" style="border:2px solid #b94464;border-radius:999px;text-align:center;"><a href="${escape(url)}" style="display:inline-block;padding:13px 24px;color:${color};font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:22px;text-decoration:none;">${escape(label)}</a></td></tr></table>`;
}

function detail(label: string, value: string, action = "") {
  return `<tr><td style="padding:24px 28px;border-top:1px solid #edd6d1;"><p style="margin:0 0 8px;color:#b94464;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${escape(label)}</p><div style="color:#171515;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:30px;">${value}</div>${action ? `<div style="padding-top:16px;">${action}</div>` : ""}</td></tr>`;
}

/** Outlook-safe appointment confirmation. Layout and critical sizing are inline and table-based. */
export function renderBookingConfirmationEmail(data: BookingConfirmationEmailData) {
  const appointment = formatAppointment(data.startsAt, data.endsAt);
  const location = `<strong>${escape(APPOINTMENT_LOCATION)}</strong><br>${escape(APPOINTMENT_ADDRESS)}<br><span style="display:inline-block;margin-top:10px;padding-left:12px;border-left:3px solid #b94464;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;line-height:20px;">${escape(locationNote(data.audience))}</span>`;
  const date = `${escape(appointment.date)}<br>${escape(appointment.time)}`;

  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>
<body style="margin:0;padding:0;background:#eee7e3;color:#171515;">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#eee7e3" style="width:100%;background:#eee7e3;">
<tr><td align="center" style="padding:24px 10px;">
<table role="presentation" width="640" border="0" cellspacing="0" cellpadding="0" bgcolor="#fffdfb" style="width:100%;max-width:640px;background:#fffdfb;border:1px solid #eaded8;">
<tr><td align="center" bgcolor="#030303" style="padding:16px 20px;background:#030303;"><img src="https://stylewithkayla.com/images/stylewithkayla_logo_white_transparent.png" width="220" alt="Style with Kayla" style="display:block;width:220px;max-width:100%;height:auto;margin:0 auto;border:0;"></td></tr>
<tr><td align="center" style="padding:34px 28px 28px;"><p style="margin:0 0 12px;color:#b94464;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Appointment confirmed</p><h1 style="margin:0 0 12px;color:#171515;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:44px;font-weight:400;">You’re booked, ${escape(data.firstName)}!</h1><p style="margin:0;color:#514a48;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">Here’s everything you need to know.</p></td></tr>
<tr><td style="padding:0 24px 24px;">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#fffaf8" style="width:100%;background:#fffaf8;border:1px solid #edd6d1;border-left:7px solid #b94464;">
${detail("Where we’ll meet", location)}
${detail("Date and time", date, button("Add to Calendar", data.calendarUrl, true))}
${detail("Appointment details", escape(data.serviceName), button("View Appointment", data.manageUrl))}
</table>
</td></tr>
<tr><td style="padding:0 24px 24px;"><table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#b94464" style="width:100%;background:#b94464;"><tr><td style="padding:24px;"><h2 style="margin:0 0 8px;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;">Complete your Style Profile</h2><p style="margin:0 0 18px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;">Your profile helps me prepare ideas and pull useful options before we meet.</p>${button("Complete Style Profile", data.profileUrl)}</td></tr></table></td></tr>
<tr><td align="center" bgcolor="#030303" style="padding:20px;background:#030303;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;letter-spacing:1px;text-transform:uppercase;">© 2026 Style with Kayla &nbsp;|&nbsp; Personal Stylist at Macy’s</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
