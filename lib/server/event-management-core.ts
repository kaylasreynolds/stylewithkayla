import { validation } from "./http";

export function instant(value: unknown, field: string): number {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{3})?)?Z$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw validation(field, "Use a valid UTC ISO date and time.");
  }

  return Date.parse(value);
}

function iso(value: number): string {
  return new Date(value).toISOString();
}

export function publicEventJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    shortDescription: row.shortDescription,
    location: row.location,
    locationDetails: row.locationDetails,
    eventDate: row.eventDate,
    startTime: row.startTime,
    endTime: row.endTime,
    allDay: Boolean(row.allDay),
    startsAt: iso(row.startsAt as number),
    endsAt: iso(row.endsAt as number),
    timezone: row.timezone,
    eventLabel: row.category,
    customLabel: row.customLabel,
    attendanceType: row.attendanceType,
    costType: row.costType,
    costLabel: row.costLabel,
    offer: row.offer,
    offerDetails: row.offerDetails,
    offerTerms: row.offerTerms,
    ctaLabel: row.ctaLabel,
    ctaAction: row.ctaAction,
    ctaUrl: row.ctaUrl,
    ctaEmail: row.ctaEmail,
    ctaPhone: row.ctaPhone,
    image: row.imageAssetId
      ? {
          url: `/api/events/assets/${row.imageAssetId}`,
          alt: row.imageAlt,
          width: row.imageWidth,
          height: row.imageHeight,
          mimeType: row.imageMimeType,
        }
      : null,
  };
}
