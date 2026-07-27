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
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: iso(row.startsAt as number),
    endsAt: iso(row.endsAt as number),
    timezone: row.timezone,
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