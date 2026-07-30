import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_IMAGE_MAX_LONG_EDGE, EVENT_IMAGE_OPTIMIZATION_ERROR, type ImageOptimizerRuntime, optimizeEventImage, safeEventImageFilename } from "../lib/event-image-optimizer";

type FakeOptions = { width: number; height: number; alpha?: boolean; sizes?: Record<string, number>; fail?: boolean };
function fakeRuntime(options: FakeOptions) {
  const renders: Array<[number, number]> = []; let encodes = 0;
  const runtime: ImageOptimizerRuntime = {
    async decode() { if (options.fail) throw new Error("decoder internals"); return { source: {} as CanvasImageSource, width: options.width, height: options.height }; },
    render(_image, width, height) { renders.push([width, height]); return { hasAlpha: () => Boolean(options.alpha), async encode(type) { encodes++; return new Blob([new Uint8Array(options.sizes?.[type] ?? 500_000)], { type }); } }; },
  };
  return { runtime, renders, get encodes() { return encodes; } };
}
function image(name: string, type: string, size: number) { return new File([new Uint8Array(size)], name, { type }); }

test("large landscape image is resized to a 2400px long edge with its aspect ratio", async () => {
  const fake = fakeRuntime({ width: 6000, height: 4000 });
  const result = await optimizeEventImage(image("landscape.jpg", "image/jpeg", 6_000_000), fake.runtime);
  assert.deepEqual(fake.renders[0], [EVENT_IMAGE_MAX_LONG_EDGE, 1600]); assert.equal(result.width / result.height, 1.5);
});
test("large portrait image is resized correctly without cropping", async () => {
  const fake = fakeRuntime({ width: 3000, height: 6000 });
  const result = await optimizeEventImage(image("portrait.jpg", "image/jpeg", 6_000_000), fake.runtime);
  assert.deepEqual([result.width, result.height], [1200, 2400]);
});
test("small already optimized image is not upscaled or recompressed", async () => {
  const fake = fakeRuntime({ width: 800, height: 600 }); const original = image("ready.webp", "image/webp", 200_000);
  const result = await optimizeEventImage(original, fake.runtime);
  assert.equal(result.file, original); assert.equal(result.wasOptimized, false); assert.equal(fake.encodes, 0); assert.deepEqual([result.width, result.height], [800, 600]);
});
test("transparent input retains an alpha-compatible output", async () => {
  const fake = fakeRuntime({ width: 3000, height: 2000, alpha: true, sizes: { "image/webp": 400_000, "image/png": 700_000 } });
  const result = await optimizeEventImage(image("overlay.png", "image/png", 4_000_000), fake.runtime);
  assert.match(result.file.type, /^image\/(webp|png)$/); assert.notEqual(result.file.type, "image/jpeg");
});
test("optimized output remains below the hard 5 MiB limit", async () => {
  const fake = fakeRuntime({ width: 5000, height: 3000, sizes: { "image/webp": 2_500_000, "image/jpeg": 2_800_000 } });
  const result = await optimizeEventImage(image("camera.jpg", "image/jpeg", 10_000_000), fake.runtime); assert.ok(result.optimizedBytes < 5 * 1024 * 1024);
});
test("optimization failure is replaced with a friendly non-technical error", async () => {
  const fake = fakeRuntime({ width: 1, height: 1, fail: true });
  await assert.rejects(() => optimizeEventImage(image("bad.jpg", "image/jpeg", 10), fake.runtime), { message: EVENT_IMAGE_OPTIMIZATION_ERROR });
});
test("original filename is converted to a safe output filename", () => {
  assert.equal(safeEventImageFilename("Kayla's Summer Event (final).JPG", "image/webp"), "Kayla-s-Summer-Event-final.webp"); assert.equal(safeEventImageFilename("💖.png", "image/png"), "event-image.png");
});
