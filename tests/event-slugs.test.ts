import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { eventSlugError, eventSlugSuggestion, normalizeEventSlug, shouldRefreshSuggestedSlug, suffixEventSlug } from "../lib/event-slug";

test("event slugs normalize titles and append the event date", () => {
  assert.equal(eventSlugSuggestion("Iberjoya Trunk Show", "09/17/26"), "iberjoya-26-09-17");
  assert.equal(eventSlugSuggestion("Fall Preview!!!", "10/03/26"), "fall-preview-26-10-03");
  assert.equal(eventSlugSuggestion("Stylist   Open House", "11/14/26"), "stylist-open-house-26-11-14");
  assert.equal(normalizeEventSlug("Café & Style — Night"), "cafe-style-night");
});

test("generated collisions receive safe suffixes and custom values validate strictly", () => {
  assert.equal(suffixEventSlug("fall-preview-26-10-03", new Set(["fall-preview-26-10-03","fall-preview-26-10-03-2"])), "fall-preview-26-10-03-3");
  assert.equal(eventSlugError("fall-preview-26-10-03"), null);
  assert.match(eventSlugError("Fall Preview") || "", /lowercase/);
  assert.match(eventSlugError("fall--preview") || "", /single hyphens/);
});

test("custom and published slugs remain stable unless deliberately edited", () => {
  assert.equal(shouldRefreshSuggestedSlug("old-suggestion", "old-suggestion", false), true);
  assert.equal(shouldRefreshSuggestedSlug("my-custom-link", "old-suggestion", true), false);
  assert.equal(shouldRefreshSuggestedSlug("published-link", "published-link", true), false);
});

test("slug migration backfills without losing rows and resolves collisions", async () => {
  const migration = await readFile(new URL("../drizzle/20260904120000_public_event_slugs.sql", import.meta.url), "utf8");
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE events(id TEXT PRIMARY KEY,title TEXT NOT NULL,event_date TEXT NOT NULL,description TEXT NOT NULL)");
  db.prepare("INSERT INTO events VALUES(?,?,?,?)").run("b","Fall Preview","10/03/26","Second");
  db.prepare("INSERT INTO events VALUES(?,?,?,?)").run("a","Fall Preview","10/03/26","First");
  db.exec(migration);
  const rows = db.prepare("SELECT id,slug,description FROM events ORDER BY id").all() as Array<{id:string;slug:string;description:string}>;
  assert.deepEqual(rows.map(row => ({...row})), [{id:"a",slug:"fall-preview-26-10-03",description:"First"},{id:"b",slug:"fall-preview-26-10-03-2",description:"Second"}]);
  assert.throws(() => db.prepare("INSERT INTO events(id,title,event_date,description,slug) VALUES(?,?,?,?,?)").run("c","Other","10/03/26","Kept","fall-preview-26-10-03"));
});

test("standalone route gates lifecycle by slug and reuses event APIs", async () => {
  const page = await readFile(new URL("../app/events/[slug]/page.tsx", import.meta.url), "utf8");
  const actions = await readFile(new URL("../app/events/[slug]/EventPageActions.tsx", import.meta.url), "utf8");
  assert.match(page, /e\.slug=\?/);
  assert.match(page, /e\.status='published'/);
  assert.match(page, /e\.archived_at IS NULL/);
  assert.match(page, /if \(!row\) notFound\(\)/);
  assert.doesNotMatch(page, /e\.ends_at[>=]/);
  assert.match(actions, /\/api\/events\/\$\{encodeURIComponent\(String\(event\.id\)\)\}\/rsvps/);
  assert.match(actions, /\/api\/events\/\$\{event\.id\}\/calendar/);
  assert.match(actions, /navigator\.share/);
});

test("details modal keeps its behavior and adds a slug-only full event link", async () => {
  const source = await readFile(new URL("../public/event-card-enhancements.js", import.meta.url), "utf8");
  assert.match(source, /View Full Event →/);
  assert.match(source, /fullEventLink\.hidden = !event\?\.slug/);
  assert.match(source, /`\/events\/\$\{encodeURIComponent\(event\.slug\)\}`/);
  assert.match(source, /action\?\.click\(\)/);
});
