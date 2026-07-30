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
