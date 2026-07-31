import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerSource = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");

test("event image multipart uploads are handled before vinext", () => {
  const uploadPath = workerSource.indexOf('url.pathname === "/api/admin/events/assets"');
  const directHandler = workerSource.indexOf("handleEventImageUploadRequest(request, env)");
  const vinextFallback = workerSource.indexOf("return handler.fetch(request, env, ctx)");

  assert.ok(uploadPath >= 0, "worker must recognize the event image upload path");
  assert.ok(directHandler > uploadPath, "worker must call the direct upload handler");
  assert.ok(
    directHandler < vinextFallback,
    "event image upload must be intercepted before the vinext fallback",
  );
});

test("worker upload environment includes the production R2 binding", () => {
  assert.match(workerSource, /PHOTO_ASSETS:\s*R2Bucket/);
});
