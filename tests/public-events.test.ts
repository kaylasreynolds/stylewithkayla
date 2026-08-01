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
    "e.cost_type",
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

test("static event cards use the approved public hierarchy", async () => {
  const script = await readFile(new URL("../public/events.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(script, /events\.length === 2 \? \[updatesCard\(\)\]/);
  assert.match(script, /More events coming soon/);
  assert.match(script, /Request Event Updates/);
  assert.match(script, /class="event-card__offer"/);
  assert.doesNotMatch(script, /<dt>Cost<\/dt>/);
  assert.match(styles, /\.events-list \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.event-date \{[^}]*bottom: 16px;[^}]*left: 16px;/);
  const sharedEventButtonRule = styles.match(
  /\.event-card__content > \.button\s*,\s*\.event-card__cta\s*\{([^}]*)\}/,
);

assert.ok(
  sharedEventButtonRule,
  "event card CTAs should share one CSS rule",
);

assert.match(sharedEventButtonRule[1], /width:\s*100%/);
assert.match(sharedEventButtonRule[1], /min-height:\s*52px/);
assert.match(sharedEventButtonRule[1], /border-radius:\s*8px/);
assert.match(sharedEventButtonRule[1], /box-shadow:\s*none/);
  assert.match(script, /class="sr-only">Time/);
  assert.doesNotMatch(script, /Space available/);
  assert.match(script, /Registration closed/);
  assert.match(script, /month: "numeric"/);
  assert.match(script, /upcoming in-store events and styling experiences/);
  assert.match(styles, /@media \(max-width: 1020px\)[^{]*\{[\s\S]*?\.events-list \{ grid-template-columns: repeat\(2/);
});

test("public Events and editor preview share the authoritative card and formatting", async () => {
  const page = await readFile(new URL("../app/events/page.tsx", import.meta.url), "utf8");
  const editor = await readFile(new URL("../app/admin/events/EventConsole.tsx", import.meta.url), "utf8");
  const card = await readFile(new URL("../components/PublicEventCard.tsx", import.meta.url), "utf8");
  assert.match(page, /<PublicEventCard event=\{e\}/);
  assert.match(editor, /<PublicEventCard event=\{form\}/);
  assert.match(card, /publicEventView\(event\)/);
  assert.match(card, /public-event-card/);
  assert.match(card, /event\.shortDescription \|\| event\.description/);
});

test("public presentation uses approved attendance wording and general RSVP semantics", async () => {
  const { CURRENT_ATTENDANCE_OPTIONS, attendanceText, publicEventView } = await import("../lib/event-presentation");
  assert.deepEqual(CURRENT_ATTENDANCE_OPTIONS.map(([, label]) => label), ["Open Attendance", "Appointment Required", "Appointment Recommended", "RSVP Required", "Information Only"]);
  assert.equal(attendanceText("general_rsvp"), "RSVP Required");
  assert.equal(publicEventView({ attendanceType: "general_rsvp", ctaAction: "registration", ctaLabel: "Register" }).ctaVisible, true);
  assert.doesNotThrow(() => publicEventView({}));
});
