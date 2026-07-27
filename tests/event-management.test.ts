import assert from "node:assert/strict";
import test from "node:test";
import { capacityAvailable, canTransitionEvent, csvCell, rangesOverlap } from "../lib/server/event-management.ts";
import { requireAdmin } from "../lib/server/admin-auth.ts";

test("event state transitions only move forward", () => {
  assert.equal(canTransitionEvent("draft", "published"), true);
  assert.equal(canTransitionEvent("published", "draft"), false);
  assert.equal(canTransitionEvent("archived", "published"), false);
});
test("capacity includes the entire RSVP party", () => {
  assert.equal(capacityAvailable(10, 8, 2), true);
  assert.equal(capacityAvailable(10, 8, 3), false);
});
test("appointment overlap uses half-open intervals", () => {
  assert.equal(rangesOverlap(10, 20, 20, 30), false);
  assert.equal(rangesOverlap(10, 21, 20, 30), true);
});
test("CSV export escapes spreadsheet fields", () => {
  assert.equal(csvCell('Kayla, "K"'), '"Kayla, ""K"""');
});
test("admin policy rejects anonymous event requests", () => {
  assert.throws(() => requireAdmin(new Request("https://example.com/api/admin/events")), (error: unknown) => error instanceof Error && "status" in error && error.status === 401);
});
