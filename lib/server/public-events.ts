import { ApiError, optionalString, rejectUnexpectedKeys, requiredString, validation } from "./http";

export const PUBLIC_EVENT_FIELDS = `e.id,e.title,e.short_description AS shortDescription,e.description,e.location,e.location_details AS locationDetails,e.directions_url AS directionsUrl,e.event_date AS eventDate,e.start_time AS startTime,e.end_time AS endTime,e.all_day AS allDay,e.starts_at AS startsAt,e.ends_at AS endsAt,e.timezone,e.category,e.custom_label AS customLabel,e.offer,e.offer_details AS offerDetails,e.offer_terms AS offerTerms,e.image_asset_id AS imageAssetId,e.image_alt AS imageAlt,e.image_width AS imageWidth,e.image_height AS imageHeight,e.attendance_type AS attendanceType,e.cost_type AS costType,e.cost_label AS costLabel,e.cta_label AS ctaLabel,e.cta_action AS ctaAction,e.cta_url AS ctaUrl,e.cta_email AS ctaEmail,e.cta_phone AS ctaPhone,e.sharing_enabled AS sharingEnabled,e.share_message AS shareMessage,e.registration_opens_at AS registrationOpensAt,e.registration_closes_at AS registrationClosesAt,e.max_guests AS maxGuests,e.allow_guest_names AS allowGuestNames,e.appointment_required AS appointmentRequired,e.appointment_recommended AS appointmentRecommended,e.unlimited_capacity AS unlimitedCapacity`;

export function publicEventJson(row: Record<string, unknown>) {
  const date = (value: unknown) => value == null ? null : new Date(Number(value)).toISOString();
  return { ...row, imageUrl: row.imageAssetId ? `/api/events/assets/${row.imageAssetId}` : null, startsAt: date(row.startsAt), endsAt: date(row.endsAt), registrationOpensAt: date(row.registrationOpensAt), registrationClosesAt: date(row.registrationClosesAt), allDay:Boolean(row.allDay),sharingEnabled:Boolean(row.sharingEnabled),allowGuestNames:Boolean(row.allowGuestNames), appointmentRequired: Boolean(row.appointmentRequired),appointmentRecommended:Boolean(row.appointmentRecommended),unlimitedCapacity:Boolean(row.unlimitedCapacity) };
}

export function assertRegistrationOpen(event: { startsAt: number; registrationOpensAt: number | null; registrationClosesAt: number | null }, now = Date.now()) {
  if (now >= event.startsAt || (event.registrationClosesAt !== null && now > event.registrationClosesAt)) throw new ApiError(409, "REGISTRATION_CLOSED", "Registration for this event is closed.");
  if (event.registrationOpensAt !== null && now < event.registrationOpensAt) throw new ApiError(409, "REGISTRATION_NOT_OPEN", "Registration for this event has not opened yet.");
}

export function parsePublicRsvp(value: Record<string, unknown>, maxGuests: number, appointmentRequired: boolean) {
  rejectUnexpectedKeys(value, ["name", "email", "phone", "guestNames", "guestCount", "notes", "appointmentSlotId"]);
  const name = requiredString(value.name, "name", 120);
  const email = requiredString(value.email, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw validation("email", "Enter a valid email address.");
  const phone = optionalString(value.phone, "phone", 40), notes = optionalString(value.notes, "notes", 1000);

  let guestNames: string[] = [];
  let guestCount = 0;

  if (value.guestCount !== undefined) {
    const parsed = Number(value.guestCount);
    if (!Number.isInteger(parsed) || parsed < 0) throw validation("guestCount", "Enter a valid number of guests.");
    guestCount = parsed;
  } else if (value.guestNames !== undefined) {
    if (!Array.isArray(value.guestNames)) throw validation("guestNames", "Provide guest information as a list.");
    const rawGuests = value.guestNames as unknown[];

    // The public RSVP form uses the existing guestNames payload key for its
    // numeric guest counter so older clients remain compatible. A single
    // non-negative integer value is treated as the guest count, not a name.
    if (
      rawGuests.length === 1 &&
      typeof rawGuests[0] === "string" &&
      /^\d+$/.test(rawGuests[0].trim())
    ) {
      guestCount = Number(rawGuests[0].trim());
    } else {
      guestNames = rawGuests.map((guest, index) => requiredString(guest, `guestNames.${index}`, 120));
      guestCount = guestNames.length;
    }
  }

  if (guestCount > maxGuests) throw validation("guestCount", `You may bring up to ${maxGuests} guest${maxGuests === 1 ? "" : "s"}.`);

  const appointmentSlotId = optionalString(value.appointmentSlotId, "appointmentSlotId", 100);
  if (appointmentRequired && !appointmentSlotId) throw validation("appointmentSlotId", "Choose an available appointment time.");
  return { name, email, phone, notes, guestNames, partySize: guestCount + 1, appointmentSlotId };
}
