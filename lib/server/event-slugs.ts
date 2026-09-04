import { eventSlugSuggestion, suffixEventSlug } from "../event-slug";
import { ApiError } from "./http";
import { getD1 } from "./runtime";

type Database = ReturnType<typeof getD1>;

export async function assertEventSlugAvailable(db: Database, slug: string, eventId = "") {
  if (!slug) return;
  const duplicate = await db.prepare("SELECT id FROM events WHERE slug=? AND id<>? LIMIT 1").bind(slug, eventId).first();
  if (duplicate) throw new ApiError(422, "DUPLICATE_EVENT_SLUG", "That public event URL is already in use.", { slug: "Choose a different public URL." });
}

export async function generatedAvailableEventSlug(db: Database, title: unknown, eventDate: unknown) {
  const base = eventSlugSuggestion(title, eventDate);
  if (!base) throw new ApiError(422, "EVENT_SLUG_REQUIRED", "A public URL could not be generated.", { slug: "Add a title and valid event date, or enter a public URL." });
  const rows = (await db.prepare("SELECT slug FROM events WHERE slug=? OR slug LIKE ?").bind(base, `${base}-%`).all<{slug:string}>()).results;
  return suffixEventSlug(base, new Set(rows.map(row => row.slug)));
}
