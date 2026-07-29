import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  EVENT_IMAGE_TOO_LARGE_MESSAGE,
  EventSubmissionGuard,
  eventImageFileError,
  readUploadResponse,
} from "../lib/event-editor-client.ts";

test("upload responses safely handle JSON, text, HTML, empty bodies, and upstream 413s", () => {
  const asset = { id: "asset-1", previewUrl: "/asset-1", width: 800, height: 600, sizeBytes: 100 };
  assert.deepEqual(readUploadResponse(201, "application/json; charset=utf-8", JSON.stringify({ data: { asset } })), asset);
  assert.throws(() => readUploadResponse(422, "application/json", JSON.stringify({ error: { message: "Unsupported image." } })), /Unsupported image/);
  assert.throws(() => readUploadResponse(500, "text/plain", "Upload service unavailable"), /Upload service unavailable/);
  assert.throws(() => readUploadResponse(502, "text/html", "<html>Bad gateway</html>"), /could not be uploaded/);
  assert.throws(() => readUploadResponse(500, null, ""), /could not be uploaded/);
  assert.throws(() => readUploadResponse(500, "application/json", "not json"), /could not be uploaded/);
  assert.throws(() => readUploadResponse(413, "text/plain", "Payload Too Large"), new RegExp(EVENT_IMAGE_TOO_LARGE_MESSAGE));
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
