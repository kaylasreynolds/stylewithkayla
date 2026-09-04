const VALID_EVENT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeEventSlug(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function eventSlugSuggestion(title: unknown, eventDate: unknown): string {
  const normalizedTitle = normalizeEventSlug(String(title ?? ""));
  const titlePart = normalizedTitle.replace(/-trunk-show$/, "") || normalizedTitle;
  const match = String(eventDate ?? "").match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  return titlePart && match ? `${titlePart}-${match[3]}-${match[1]}-${match[2]}` : "";
}

export function eventSlugError(value: unknown): string | null {
  const slug = String(value ?? "");
  if (!slug) return null;
  if (slug.length > 180) return "Keep the public URL under 180 characters.";
  return VALID_EVENT_SLUG.test(slug) ? null : "Use lowercase letters, numbers, and single hyphens only.";
}

export function suffixEventSlug(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function shouldRefreshSuggestedSlug(current: string, previousSuggestion: string, customized: boolean) {
  return !customized && (!current || current === previousSuggestion);
}
