import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertRegistrationOpen, parsePublicRsvp, PUBLIC_EVENT_FIELDS } from "../lib/server/public-events";

test("public event projection excludes private and lifecycle fields", () => {
  const projectedColumns = PUBLIC_EVENT_FIELDS
    .split(",")
    .map(field => field.trim().split(/\s+AS\s+/i)[0]);

  for (const field of [
    "e.created_by",
    "e.created_at",
    "e.updated_at",
    "e.capacity",
    "e.allow_duplicate_registration",
    "e.published_at",
    "e.archived_at",
  ]) {
    assert.equal(
      projectedColumns.includes(field),
      false,
      `${field} must not be included in the public projection`,
    );
  }

  for (const field of [
    "e.title",
    "e.short_description",
    "e.location",
    "e.category",
    "e.image_asset_id",
    "e.attendance_type",
    "e.cost_label",
  ]) {
    assert.equal(
      projectedColumns.includes(field),
      true,
      `${field} must be included in the public projection`,
    );
  }
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
