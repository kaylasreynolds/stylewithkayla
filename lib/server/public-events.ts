import { ApiError, optionalString, rejectUnexpectedKeys, requiredString, validation } from "./http";

export const PUBLIC_EVENT_FIELDS = `e.id,e.title,e.description,e.location,e.starts_at AS startsAt,e.ends_at AS endsAt,e.timezone,e.category,e.image_url AS imageUrl,e.attendance_type AS attendanceType,e.cost_label AS costLabel,e.registration_opens_at AS registrationOpensAt,e.registration_closes_at AS registrationClosesAt,e.max_guests AS maxGuests,e.appointment_required AS appointmentRequired`;

export function publicEventJson(row: Record<string, unknown>) {
  const date = (value: unknown) => value == null ? null : new Date(Number(value)).toISOString();
  return { ...row, startsAt: date(row.startsAt), endsAt: date(row.endsAt), registrationOpensAt: date(row.registrationOpensAt), registrationClosesAt: date(row.registrationClosesAt), appointmentRequired: Boolean(row.appointmentRequired) };
}

export function assertRegistrationOpen(event: { startsAt: number; registrationOpensAt: number | null; registrationClosesAt: number | null }, now = Date.now()) {
  if (now >= event.startsAt || (event.registrationClosesAt !== null && now > event.registrationClosesAt)) throw new ApiError(409, "REGISTRATION_CLOSED", "Registration for this event is closed.");
  if (event.registrationOpensAt !== null && now < event.registrationOpensAt) throw new ApiError(409, "REGISTRATION_NOT_OPEN", "Registration for this event has not opened yet.");
}

export function parsePublicRsvp(value: Record<string, unknown>, maxGuests: number, appointmentRequired: boolean) {
  rejectUnexpectedKeys(value, ["name", "email", "phone", "guestNames", "notes", "appointmentSlotId"]);
  const name = requiredString(value.name, "name", 120);
  const email = requiredString(value.email, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw validation("email", "Enter a valid email address.");
  const phone = optionalString(value.phone, "phone", 40), notes = optionalString(value.notes, "notes", 1000);
  if (value.guestNames !== undefined && !Array.isArray(value.guestNames)) throw validation("guestNames", "Provide guest names as a list.");
  const guestNames = (value.guestNames as unknown[] | undefined ?? []).map((guest, index) => requiredString(guest, `guestNames.${index}`, 120));
  if (guestNames.length > maxGuests) throw validation("guestNames", `You may bring up to ${maxGuests} guest${maxGuests === 1 ? "" : "s"}.`);
  const appointmentSlotId = optionalString(value.appointmentSlotId, "appointmentSlotId", 100);
  if (appointmentRequired && !appointmentSlotId) throw validation("appointmentSlotId", "Choose an available appointment time.");
  return { name, email, phone, notes, guestNames, partySize: guestNames.length + 1, appointmentSlotId };
}
