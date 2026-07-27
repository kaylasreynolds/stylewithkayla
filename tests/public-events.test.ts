import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertRegistrationOpen, parsePublicRsvp, PUBLIC_EVENT_FIELDS } from "../lib/server/public-events.ts";

test("public event projection excludes private and lifecycle fields", () => {
  for (const field of ["created_by", "created_at", "updated_at", "capacity", "allow_duplicate_registration"]) assert.equal(PUBLIC_EVENT_FIELDS.includes(field), false);
  for (const field of ["title", "description", "location", "category", "image_url", "attendance_type", "cost_label"]) assert.equal(PUBLIC_EVENT_FIELDS.includes(field), true);
});

test("public listing statically requires published, non-archived future events", async () => {
  const source = await readFile(new URL("../app/api/events/route.ts", import.meta.url), "utf8");
  assert.match(source, /status='published'/);
  assert.match(source, /archived_at IS NULL/);
  assert.match(source, /ends_at>\?/);
});

test("registration windows and guest limits are server policies", () => {
  const event = { startsAt: 300, registrationOpensAt: 100, registrationClosesAt: 200 };
  assert.throws(() => assertRegistrationOpen(event, 50));
  assert.doesNotThrow(() => assertRegistrationOpen(event, 150));
  assert.throws(() => assertRegistrationOpen(event, 250));
  assert.throws(() => parsePublicRsvp({ name:"Kayla", email:"k@example.com", guestNames:["A", "B"] }, 1, false));
  assert.throws(() => parsePublicRsvp({ name:"Kayla", email:"k@example.com" }, 0, true));
});

test("events HTML retains empty state and accessible registration controls", async () => {
  const html = await readFile(new URL("../public/events.html", import.meta.url), "utf8");
  assert.match(html, /id="events-empty"[^>]*hidden/);
  assert.match(html, /New events are coming soon/);
  assert.match(html, /<dialog[^>]+aria-labelledby="rsvp-title"/);
  assert.match(html, /id="rsvp-message" role="status"/);
  assert.match(html, /name="email" type="email"[^>]*required/);
});
