import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildEventPayload,
  EDITABLE_EVENT_FIELDS,
  EVENT_IMAGE_TOO_LARGE_MESSAGE,
  EventSubmissionGuard,
  eventImageFileError,
  defaultEventCostLabel,
  hasEventOffer,
  isUploadedEventImage,
  readUploadResponse,
  withoutEventOffer,
} from "../lib/event-editor-client.ts";

test("loaded events produce an allowlisted POST and PATCH payload", () => {
  const approved = Object.fromEntries(EDITABLE_EVENT_FIELDS.map((field, index) => [field, `${field}-${index}`]));
  const serverOwned = {
    id: "original-event-id", status: "draft", startsAt: "derived", endsAt: "derived",
    publishedAt: null, archivedAt: null, createdAt: "derived", updatedAt: "derived",
    imageMimeType: "image/webp", imageSizeBytes: 123, imageWidth: 800, imageHeight: 600,
    confirmed_count: 12, confirmedCount: 12, rsvpCount: 12, appointmentSlots: [], spotsRemaining: 8,
    apiOnlyFutureValue: "must not leak",
  };

  const payload = buildEventPayload({ ...approved, ...serverOwned });
  assert.deepEqual(payload, approved);
  for (const field of Object.keys(serverOwned)) assert.equal(Object.hasOwn(payload, field), false, field);
  assert.equal(payload.imageAssetId, approved.imageAssetId);
});

test("the PATCH route sanitizes the loaded event before strict merge validation", async () => {
  const source = await readFile(new URL("../app/api/admin/events/[eventId]/route.ts", import.meta.url), "utf8");
  assert.match(source, /buildEventPayload\(eventJson\(current\)\)/);
  assert.doesNotMatch(source, /parseEvent\(\{\.\.\.eventJson\(current\)/);
});

test("editor cost defaults and explicit offer removal preserve the approved model", () => {
  assert.equal(defaultEventCostLabel("complimentary"), "Complimentary");
  assert.equal(defaultEventCostLabel("free_with_rsvp"), "Free with RSVP");
  assert.equal(defaultEventCostLabel("paid"), "");
  const event = { title: "Open House", offer: "Gift", offerDetails: "Details", offerTerms: "Terms" };
  assert.equal(hasEventOffer(event), true);
  assert.deepEqual(withoutEventOffer(event), { title: "Open House", offer: "", offerDetails: "", offerTerms: "" });
  assert.equal(hasEventOffer(withoutEventOffer(event)), false);
});

test("upload responses safely handle JSON, text, HTML, empty bodies, and upstream 413s", () => {
  const asset = { id: "asset-1", previewUrl: "/asset-1", width: 800, height: 600, sizeBytes: 100 };
  assert.deepEqual(readUploadResponse(201, "application/json; charset=utf-8", JSON.stringify({ data: { asset } })), asset);
  assert.throws(() => readUploadResponse(422, "application/json", JSON.stringify({ error: { message: "Unsupported image." } })), /Unsupported image/);
  assert.throws(() => readUploadResponse(500, "text/plain", "Upload service unavailable"), /Upload service unavailable/);
  assert.throws(() => readUploadResponse(502, "text/html", "<html>Bad gateway</html>"), /could not be uploaded/);
  assert.throws(() => readUploadResponse(500, null, ""), /could not be uploaded/);
  assert.throws(() => readUploadResponse(500, "application/json", "not json"), /could not be uploaded/);
  assert.throws(() => readUploadResponse(413, "text/plain", "Payload Too Large"), new RegExp(EVENT_IMAGE_TOO_LARGE_MESSAGE));
  assert.throws(() => readUploadResponse(201, "application/json", JSON.stringify({ data: { asset: { id: "asset-1" } } })), /could not be uploaded/);
});

test("only a validated server asset matching imageAssetId completes the image requirement", () => {
  const asset = { id: "asset-1", previewUrl: "/asset-1", width: 800, height: 600, sizeBytes: 100 };
  assert.equal(isUploadedEventImage(null, null), false, "an optimized local preview has no server asset");
  assert.equal(isUploadedEventImage(asset, null), false, "asset and form state must both be established");
  assert.equal(isUploadedEventImage(asset, "different-asset"), false);
  assert.equal(isUploadedEventImage(asset, "asset-1"), true);
});

test("event image upload still uses the safe response parser", async () => {
  const source = await readFile(new URL("../app/admin/events/EventConsole.tsx", import.meta.url), "utf8");
  assert.match(source, /readUploadResponse\(xhr\.status,xhr\.getResponseHeader\('content-type'\),xhr\.responseText\)/);
});

test("oversized files are rejected before an upload request is needed", () => {
  assert.equal(eventImageFileError(5 * 1024 * 1024), null);
  assert.equal(eventImageFileError(5 * 1024 * 1024 + 1), EVENT_IMAGE_TOO_LARGE_MESSAGE);
});

test("rapid create submissions are synchronously rejected", () => {
  const guard = new EventSubmissionGuard();
  assert.deepEqual(guard.begin(), { method: "POST", url: "/api/admin/events" });
  assert.equal(guard.begin(), null);
});

test("create then edit saves exactly one event record and switches to PATCH", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE events (id TEXT PRIMARY KEY, title TEXT NOT NULL)");
  const guard = new EventSubmissionGuard();

  const create = guard.begin();
  assert.equal(create?.method, "POST");
  db.prepare("INSERT INTO events(id,title) VALUES(?,?)").run("event-1", "Original title");
  guard.captureEventId("event-1");
  guard.finish();

  const edit = guard.begin();
  assert.deepEqual(edit, { eventId: "event-1", method: "PATCH", url: "/api/admin/events/event-1" });
  db.prepare("UPDATE events SET title=? WHERE id=?").run("Edited title", edit?.eventId);
  guard.finish();

  const saved = db.prepare("SELECT COUNT(*) count, MAX(title) title FROM events").get() as { count: number; title: string };
  assert.equal(saved.count, 1);
  assert.equal(saved.title, "Edited title");
});

test("Save Draft, Save Changes, and save-before-publish preserve the authoritative ID", () => {
  for (const path of ["Save Draft", "Save Changes", "save-before-publish"]) {
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE events (id TEXT PRIMARY KEY, title TEXT NOT NULL)");
    db.prepare("INSERT INTO events(id,title) VALUES(?,?)").run("original-id", "Loaded draft");
    const guard = new EventSubmissionGuard("original-id");
    const target = guard.begin();
    assert.deepEqual(target, { eventId: "original-id", method: "PATCH", url: "/api/admin/events/original-id" }, path);
    const payload = buildEventPayload({ id: "original-id", title: `${path} title`, status: "draft" });
    db.prepare("UPDATE events SET title=? WHERE id=?").run(payload.title, target?.eventId);
    guard.captureEventId("original-id");
    guard.finish();
    const rows = db.prepare("SELECT id,title FROM events").all() as Array<{ id: string; title: string }>;
    assert.equal(rows.length, 1, path);
    assert.equal(rows[0].id, "original-id", path);
    assert.equal(rows[0].title, `${path} title`, path);
  }
});

test("Event Editor uses corrected copy, current choices, a shared card, and a synchronous navigation guard", async () => {
  const source = await readFile(new URL("../app/admin/events/EventConsole.tsx", import.meta.url), "utf8");
  assert.match(source, /<label>Alt text<textarea/);
  assert.doesNotMatch(source, /Meaningful alternative text|Briefly describe the image for someone who cannot see it|The uploaded image is displayed in full/);
  assert.match(source, /const labels=CURRENT_EVENT_LABELS/);
  assert.match(source, /const attendance=CURRENT_ATTENDANCE_OPTIONS/);
  assert.match(source, /<PublicEventCard event=\{form\}/);
  assert.match(source, /if\(dirtyRef\.current\)/);
  assert.match(source, /dirtyRef\.current = false;\s*setDirty\(false\);\s*location\.href/);
  assert.ok(source.indexOf("dirtyRef.current = false") > source.indexOf("if (publish)"), "publish failures must retain the guard");
});
