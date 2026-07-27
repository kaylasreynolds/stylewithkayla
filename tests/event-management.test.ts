import assert from "node:assert/strict";
import test from "node:test";
import { capacityAvailable, canTransitionEvent, csvCell, publicEventJson, rangesOverlap } from "../lib/server/event-management.ts";
import { requireAdmin } from "../lib/server/admin-auth.ts";
import { EVENT_IMAGE_MAX_BYTES, eventAssetOwnedBy, inspectEventImage, meaningfulAlt } from "../lib/server/event-images.ts";

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
test("event image inspection rejects invalid formats and oversized assets", () => {
  assert.throws(() => inspectEventImage(new Uint8Array([0x47, 0x49, 0x46])), /supported JPG, PNG, or WebP/);
  assert.throws(() => inspectEventImage(new Uint8Array(EVENT_IMAGE_MAX_BYTES + 1)), /5 MB/);
});
test("event image dimensions come from contents rather than browser metadata", () => {
  const png = new Uint8Array(24); png.set([137,80,78,71,13,10,26,10]); png.set([0,0,4,0,0,0,3,0],16);
  assert.deepEqual(inspectEventImage(png), { mimeType:"image/png", extension:"png", width:1024, height:768, sizeBytes:24 });
});
test("meaningful event alternative text is required", () => {
  assert.throws(() => meaningfulAlt("photo"), /meaningful/);
  assert.equal(meaningfulAlt("Kayla presenting a spring styling workshop"), "Kayla presenting a spring styling workshop");
});
test("replacement assets must belong to the authenticated administrator", () => {
  assert.equal(eventAssetOwnedBy("owner@example.com", "intruder@example.com"), false);
  assert.equal(eventAssetOwnedBy("OWNER@example.com", "owner@example.com"), true);
});
test("public event serialization excludes storage and administrative fields", () => {
  const result=publicEventJson({id:"e1",title:"Show",description:"Desc",location:"Boise",startsAt:1,endsAt:2,timezone:"America/Boise",imageAssetId:"a1",imageAlt:"Models showing spring outfits",imageWidth:1200,imageHeight:800,imageMimeType:"image/webp",imageStorageKey:"secret/key",createdBy:"private@example.com"});
  assert.equal(JSON.stringify(result).includes("secret"),false);assert.equal(JSON.stringify(result).includes("private@example.com"),false);assert.equal(result.image?.alt,"Models showing spring outfits");
});
