import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_IMAGE_MAX_BYTES, readEventImageUpload } from "../lib/server/event-images";
import { ApiError } from "../lib/server/http";

function png(size: number, name = "event.png") {
  const bytes = new Uint8Array(size);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(bytes.buffer).setUint32(16, 1200); new DataView(bytes.buffer).setUint32(20, 800);
  return new File([bytes], name, { type: "image/png" });
}
function request(file: File, extraBytes = 0) {
  const form = new FormData(); form.set("file", file);
  if (extraBytes) form.set("unrelatedMultipartData", "x".repeat(extraBytes));
  return new Request("https://example.test/api/admin/events/assets", { method: "POST", body: form });
}

test("the same 1.51 MiB image is received with its File metadata and byte length", async () => {
  const file = png(1_583_350, "manual-test.png");
  const received = await readEventImageUpload(request(file));
  assert.equal(received.file.name, "manual-test.png");
  assert.equal(received.file.type, "image/png");
  assert.equal(received.file.size, 1_583_350);
  assert.equal(received.bytes.byteLength, file.size);
  assert.equal(received.inspected.sizeBytes, file.size);
});

test("exactly 5 MiB passes and one byte over fails", async () => {
  const exact = await readEventImageUpload(request(png(EVENT_IMAGE_MAX_BYTES)));
  assert.equal(exact.file.size, 5 * 1024 * 1024);
  assert.equal(exact.inspected.sizeBytes, exact.file.size);
  await assert.rejects(() => readEventImageUpload(request(png(EVENT_IMAGE_MAX_BYTES + 1))),
    (error: unknown) => error instanceof ApiError && error.status === 413 && error.code === "EVENT_IMAGE_TOO_LARGE");
});

test("multipart overhead and Content-Length are not treated as image bytes", async () => {
  const file = png(1_583_350);
  const multipart = request(file, EVENT_IMAGE_MAX_BYTES);
  multipart.headers.set("content-length", String(20 * 1024 * 1024));
  assert.ok((await multipart.clone().arrayBuffer()).byteLength > EVENT_IMAGE_MAX_BYTES);
  const received = await readEventImageUpload(multipart);
  assert.equal(received.file.size, file.size);
  assert.equal(received.inspected.sizeBytes, file.size);
});

import { EventImageUploadFailure, uploadEventImageAsset } from "../lib/server/event-image-upload";

function storage(overrides: { put?: () => unknown; insert?: () => unknown; delete?: () => unknown } = {}) {
  const objects = new Map<string, Uint8Array>();
  let inserted: unknown[] | null = null;
  const bucket = {
    async put(key: string, value: Uint8Array) { if (overrides.put) await overrides.put(); objects.set(key, value); },
    async delete(key: string) { if (overrides.delete) await overrides.delete(); objects.delete(key); },
  };
  const db = { prepare() { return { bind(...values: unknown[]) { return { async run() { if (overrides.insert) await overrides.insert(); inserted = values; } }; } }; } };
  return { bucket, db, objects, inserted: () => inserted };
}

test("under-5-MiB multipart upload stores the optimized bytes and returns a complete asset", async () => {
  const file = png(1_583_350, "optimized-event.png"), fake = storage();
  const asset = await uploadEventImageAsset(request(file), "admin@example.com", "IMG-ABC123", fake.bucket as never, fake.db as never);
  assert.match(asset.id, /^[0-9a-f-]{36}$/i);
  assert.equal(asset.previewUrl, `/api/admin/events/assets/${asset.id}`);
  assert.equal(asset.mimeType, "image/png");
  assert.equal(asset.width, 1200); assert.equal(asset.height, 800); assert.equal(asset.sizeBytes, file.size);
  assert.equal([...fake.objects.values()][0].byteLength, file.size);
  assert.equal(fake.inserted()?.[5], file.size);
});

test("R2 failures are categorized with a safe reference", async () => {
  const fake = storage({ put: () => { throw new Error("secret bucket detail"); } });
  await assert.rejects(() => uploadEventImageAsset(request(png(1024)), "admin@example.com", "IMG-ABC123", fake.bucket as never, fake.db as never),
    (error: unknown) => error instanceof EventImageUploadFailure && error.code === "EVENT_IMAGE_UPLOAD_FAILED" && error.diagnostic.reference === "IMG-ABC123" && error.diagnostic.category === "R2_PUT");
  assert.equal(fake.objects.size, 0);
});

test("D1 failure removes the newly written R2 object", async () => {
  const fake = storage({ insert: () => { throw new Error("private SQL detail"); } });
  await assert.rejects(() => uploadEventImageAsset(request(png(1024)), "admin@example.com", "IMG-DEF456", fake.bucket as never, fake.db as never), EventImageUploadFailure);
  assert.equal(fake.objects.size, 0);
});
