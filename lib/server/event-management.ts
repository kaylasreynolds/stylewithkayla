import { ApiError, optionalString, rejectUnexpectedKeys, requiredString, validation } from "./http";
import { meaningfulAlt } from "./event-images";

export const eventStatuses = ["draft", "published", "archived"] as const;
export const rsvpStatuses = ["confirmed", "waitlisted", "cancelled", "declined"] as const;
export function enumValue<T extends string>(value: unknown, field: string, values: readonly T[]): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw validation(field, `Choose one of: ${values.join(", ")}.`);
  return value as T;
}
export function positiveInteger(value: unknown, field: string, max = 100000) {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > max) throw validation(field, `Enter a whole number from 1 to ${max}.`);
  return value as number;
}
export function instant(value: unknown, field: string) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{3})?)?Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw validation(field, "Use a valid UTC ISO date and time.");
  return Date.parse(value);
}
export function parseEvent(value: Record<string, unknown>, partial = false) {
  rejectUnexpectedKeys(value, ["title", "description", "location", "startsAt", "endsAt", "timezone", "capacity"]);
  const output: Record<string, unknown> = {};
  const take = (key: string, fn: (v: unknown) => unknown) => { if (!partial || key in value) output[key] = fn(value[key]); };
  take("title", v => requiredString(v, "title", 160));
  take("description", v => optionalString(v, "description", 5000) ?? "");
  take("location", v => requiredString(v, "location", 300));
  take("startsAt", v => instant(v, "startsAt")); take("endsAt", v => instant(v, "endsAt"));
  take("timezone", v => requiredString(v, "timezone", 64)); take("capacity", v => positiveInteger(v, "capacity", 10000));
  if (output.startsAt !== undefined && output.endsAt !== undefined && (output.endsAt as number) <= (output.startsAt as number)) throw validation("endsAt", "End time must be after start time.");
  if (partial && !Object.keys(output).length) throw new ApiError(400, "EMPTY_UPDATE", "Provide at least one field to update.");
  return output;
}
export const iso = (value: number | null) => value == null ? null : new Date(value).toISOString();
export function eventJson(row: Record<string, unknown>) { const value=(camel:string,snake:string)=>row[camel]??row[snake];return { ...row, id:row.id,title:row.title,description:row.description,location:row.location,timezone:row.timezone,capacity:row.capacity,status:row.status,startsAt:iso(value("startsAt","starts_at") as number),endsAt:iso(value("endsAt","ends_at") as number),publishedAt:iso(value("publishedAt","published_at") as number|null),archivedAt:iso(value("archivedAt","archived_at") as number|null),createdAt:iso(value("createdAt","created_at") as number),updatedAt:iso(value("updatedAt","updated_at") as number),imageAssetId:value("imageAssetId","image_asset_id")??null,imageMimeType:value("imageMimeType","image_mime_type")??null,imageSizeBytes:value("imageSizeBytes","image_size_bytes")??null,imageWidth:value("imageWidth","image_width")??null,imageHeight:value("imageHeight","image_height")??null,imageAlt:value("imageAlt","image_alt")??"" }; }
export function publicEventJson(row: Record<string, unknown>) {
  return { id: row.id, title: row.title, description: row.description, location: row.location, startsAt: iso(row.startsAt as number), endsAt: iso(row.endsAt as number), timezone: row.timezone, image: row.imageAssetId ? { url: `/api/events/assets/${row.imageAssetId}`, alt: row.imageAlt, width: row.imageWidth, height: row.imageHeight, mimeType: row.imageMimeType } : null };
}
export function csvCell(value: unknown) { const s = String(value ?? ""); return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; }
export function canTransitionEvent(from: string, to: string) { return (from === "draft" && to === "published") || ((from === "draft" || from === "published") && to === "archived"); }
export function capacityAvailable(capacity: number, confirmed: number, requested: number) { return Number.isInteger(requested) && requested > 0 && confirmed + requested <= capacity; }
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) { return aStart < bEnd && aEnd > bStart; }
