import { ApiError, optionalString, rejectUnexpectedKeys, requiredString, validation } from "./http";

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
  rejectUnexpectedKeys(value, ["title", "description", "location", "startsAt", "endsAt", "timezone", "capacity", "category", "imageUrl", "attendanceType", "costLabel", "registrationOpensAt", "registrationClosesAt", "maxGuests", "allowDuplicateRegistration", "appointmentRequired"]);
  const output: Record<string, unknown> = {};
  const take = (key: string, fn: (v: unknown) => unknown) => { if (!partial || key in value) output[key] = fn(value[key]); };
  take("title", v => requiredString(v, "title", 160));
  take("description", v => optionalString(v, "description", 5000) ?? "");
  take("location", v => requiredString(v, "location", 300));
  take("startsAt", v => instant(v, "startsAt")); take("endsAt", v => instant(v, "endsAt"));
  take("timezone", v => requiredString(v, "timezone", 64)); take("capacity", v => positiveInteger(v, "capacity", 10000));
  take("category", v => requiredString(v ?? "Store Event", "category", 80)); take("imageUrl", v => optionalString(v, "imageUrl", 500));
  take("attendanceType", v => requiredString(v ?? "In person", "attendanceType", 80)); take("costLabel", v => requiredString(v ?? "Complimentary", "costLabel", 80));
  const optionalInstant = (v: unknown, field: string) => v == null || v === "" ? null : instant(v, field);
  take("registrationOpensAt", v => optionalInstant(v, "registrationOpensAt")); take("registrationClosesAt", v => optionalInstant(v, "registrationClosesAt"));
  take("maxGuests", v => { v ??= 0; if (!Number.isInteger(v) || Number(v) < 0 || Number(v) > 20) throw validation("maxGuests", "Enter a whole number from 0 to 20."); return v; });
  take("allowDuplicateRegistration", v => { v ??= false; if (typeof v !== "boolean") throw validation("allowDuplicateRegistration", "Choose yes or no."); return v ? 1 : 0; });
  take("appointmentRequired", v => { v ??= false; if (typeof v !== "boolean") throw validation("appointmentRequired", "Choose yes or no."); return v ? 1 : 0; });
  if (output.startsAt !== undefined && output.endsAt !== undefined && (output.endsAt as number) <= (output.startsAt as number)) throw validation("endsAt", "End time must be after start time.");
  if (partial && !Object.keys(output).length) throw new ApiError(400, "EMPTY_UPDATE", "Provide at least one field to update.");
  return output;
}
export const iso = (value: number | null) => value == null ? null : new Date(value).toISOString();
export function eventJson(row: Record<string, unknown>) { return { ...row, startsAt: iso(row.startsAt as number), endsAt: iso(row.endsAt as number), publishedAt: iso(row.publishedAt as number | null), archivedAt: iso(row.archivedAt as number | null), createdAt: iso(row.createdAt as number), updatedAt: iso(row.updatedAt as number) }; }
export function csvCell(value: unknown) { const s = String(value ?? ""); return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; }
export function canTransitionEvent(from: string, to: string) { return (from === "draft" && to === "published") || ((from === "draft" || from === "published") && to === "archived"); }
export function capacityAvailable(capacity: number, confirmed: number, requested: number) { return Number.isInteger(requested) && requested > 0 && confirmed + requested <= capacity; }
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) { return aStart < bEnd && aEnd > bStart; }
