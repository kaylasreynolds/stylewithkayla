import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lifecycleRoutes = [
  "app/api/bookings/route.ts",
  "app/api/admin/bookings/[bookingId]/[action]/route.ts",
  "app/api/admin/bookings/[bookingId]/reschedule-request/route.ts",
  "app/api/client-actions/[token]/accept-proposed-time/route.ts",
  "app/api/client-actions/[token]/decline-proposed-time/route.ts",
  "app/api/client-actions/[token]/request-another-time/route.ts",
  "app/api/manage/[token]/cancel/route.ts",
  "app/api/manage/[token]/reschedule/route.ts",
];

test("appointment lifecycle routes invoke real delivery and contain no deferred-email placeholders", async () => {
  const sources = await Promise.all(lifecycleRoutes.map(path => readFile(new URL(`../${path}`, import.meta.url), "utf8")));
  for (const [index, source] of sources.entries()) {
    assert.match(source, /deliverAppointmentEmails/, `${lifecycleRoutes[index]} must invoke appointment email delivery`);
    assert.doesNotMatch(source, /deliveryDeferred\s*:\s*true/, `${lifecycleRoutes[index]} must not record a fake deferred delivery`);
  }
});

test("appointment delivery records queued, sent, and failed outcomes", async () => {
  const source = await readFile(new URL("../lib/server/appointment-email-delivery.ts", import.meta.url), "utf8");
  assert.match(source, /'queued'/);
  assert.match(source, /status='sent'/);
  assert.match(source, /status='failed'/);
  assert.match(source, /graph\.microsoft\.com\/v1\.0\/users/);
  assert.match(source, /saveToSentItems: true/);
});

test("client action pages bypass image optimization and nonessential sticky capture behavior", async () => {
  const page = await readFile(new URL("../app/client-actions/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(page, /unoptimized/);
  assert.match(page, /client-action-shell/);
  assert.equal(page.match(/APPOINTMENT TIME/g)?.length, 1);
  assert.match(css, /\.client-action-shell \.site-header \{ position:static; \}/);
  assert.match(css, /\.profile-welcome \{ position:static; \}/);
});
