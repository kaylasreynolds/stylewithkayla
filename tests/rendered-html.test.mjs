import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("declares development preview metadata", async () => {
  const source = await import("node:fs/promises").then(({readFile}) => readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"));
  assert.match(source, /["']codex-preview["']\s*:\s*["']development["']/i);
  assert.ok(developmentPreviewMeta.test('<meta name="codex-preview" content="development">'));
});
