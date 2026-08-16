export const APPOINTMENT_TIMEZONE = "America/Boise";
export const APPOINTMENT_LOCATION = "Macy’s Boise Towne Square";
export const APPOINTMENT_ADDRESS = "370 N. Milwaukee St., Boise, ID 83704";
export function locationNote(audience: string) {
  return audience === "men" ? "SOUTH ENTRANCE IN MEN’S DEPARTMENT" : "WEST ENTRANCE, NEAR CUSTOMER SERVICE";
}
export function formatAppointment(startsAt: number, endsAt: number) {
  const date = new Intl.DateTimeFormat("en-US", { timeZone: APPOINTMENT_TIMEZONE, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(startsAt);
  const time = (value: number) => new Intl.DateTimeFormat("en-US", { timeZone: APPOINTMENT_TIMEZONE, hour: "numeric", minute: "2-digit" }).format(value).replace(" AM", "am").replace(" PM", "pm");
  return { date, time: `${time(startsAt)} – ${time(endsAt)}` };
}
export function appointmentIcs(input: { startsAt:number; endsAt:number; serviceName:string }) {
  const stamp=(value:number)=>new Date(value).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const safe=(value:string)=>value.replace(/([,;\\])/g,"\\$1").replace(/\n/g,"\\n");
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Style with Kayla//Appointment//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${crypto.randomUUID()}@stylewithkayla.com`,`DTSTAMP:${stamp(Date.now())}`,`DTSTART:${stamp(input.startsAt)}`,`DTEND:${stamp(input.endsAt)}`,"SUMMARY:Style with Kayla Appointment",`DESCRIPTION:${safe(input.serviceName)}`,`LOCATION:${safe(`${APPOINTMENT_LOCATION}, ${APPOINTMENT_ADDRESS}`)}`,"END:VEVENT","END:VCALENDAR",""] .join("\r\n");
}
