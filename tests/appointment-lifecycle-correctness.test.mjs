import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

const migration = await readFile(new URL("../drizzle/0000_silent_ser_duncan.sql", import.meta.url), "utf8");
const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function database() {
  const db = new DatabaseSync(":memory:");
  for (const statement of migration.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean)) db.exec(statement);
  return db;
}

function bookingFixture(db, status = "confirmed") {
  const now = Date.now();
  const service = db.prepare("SELECT id FROM services ORDER BY sort_order LIMIT 1").get();
  db.prepare("INSERT INTO clients(id,full_name,email,normalized_email,phone,created_at,updated_at) VALUES('client','Test Client','test@example.com','test@example.com','2085550100',?,?)").run(now, now);
  db.prepare("INSERT INTO bookings(id,public_reference,client_id,service_id,status,requested_start_at,requested_end_at,confirmed_start_at,confirmed_end_at,returning_client,how_heard,privacy_policy_version,privacy_acknowledged_at,pending_since,created_at,updated_at) VALUES('booking','SWK-TEST','client',?,?,?,?,?,?,0,'Referral','test',?,?,?,?)").run(service.id, status, now + 86_400_000, now + 90_000_000, status === "confirmed" ? now + 86_400_000 : null, status === "confirmed" ? now + 90_000_000 : null, now, now, now, now);
  return now;
}

test("client alternate-time page exposes a reload-safe terminal decline path with delivery", async () => {
  const [page, route, loader, delivery] = await Promise.all([
    source("app/client-actions/page.tsx"),
    source("app/api/client-actions/[token]/decline-proposed-time/route.ts"),
    source("app/api/client-actions/[token]/route.ts"),
    source("lib/server/appointment-email-delivery.ts"),
  ]);
  assert.match(page, /Decline and cancel request/);
  assert.match(page, /decline-proposed-time/);
  assert.match(route, /status='cancelled'/);
  assert.match(route, /release_reason/);
  assert.match(route, /deliverAppointmentEmails\(db, "proposal_declined"/);
  assert.match(loader, /findClientActionAccess/);
  assert.match(loader, /decline_proposed_time/);
  assert.match(delivery, /proposal_declined_admin_notification/);
});

test("admin lifecycle email delivery no longer depends on a pre-existing active hold", async () => {
  const route = await source("app/api/admin/bookings/[bookingId]/[action]/route.ts");
  assert.doesNotMatch(route, /includes\(action\) && b\.holdStartsAt/);
  assert.match(route, /deliveryWindow\(action, b, body\)/);
  assert.match(route, /requestedStartAt/);
  assert.match(route, /confirmedStartAt/);
});

test("cancelled manage pages are terminal and cancellation preserves manage access", async () => {
  const [page, clientRoute, adminRoute] = await Promise.all([
    source("app/manage/ManageAppointment.tsx"),
    source("app/api/manage/[token]/cancel/route.ts"),
    source("app/api/admin/bookings/[bookingId]/[action]/route.ts"),
  ]);
  assert.match(page, /a\.status==="cancelled"/);
  assert.match(page, /Appointment Cancelled/);
  assert.match(page, /Your appointment is cancelled/);
  assert.match(clientRoute, /purpose<>'manage_appointment'/);
  assert.match(adminRoute, /purpose<>'manage_appointment'/);
});

test("cancellation revokes action tokens but leaves the manage token usable", () => {
  const db = database();
  const now = bookingFixture(db);
  const insert = db.prepare("INSERT INTO private_access_tokens(id,booking_id,purpose,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?)");
  insert.run("manage", "booking", "manage_appointment", "manage-hash", now + 86_400_000, now);
  insert.run("profile", "booking", "style_profile", "profile-hash", now + 86_400_000, now);
  insert.run("alternate", "booking", "alternate_time", "alternate-hash", now + 86_400_000, now);
  db.prepare("UPDATE private_access_tokens SET revoked_at=? WHERE booking_id=? AND purpose<>'manage_appointment' AND revoked_at IS NULL").run(now + 1, "booking");
  assert.equal(db.prepare("SELECT revoked_at FROM private_access_tokens WHERE id='manage'").get().revoked_at, null);
  assert.equal(db.prepare("SELECT revoked_at FROM private_access_tokens WHERE id='profile'").get().revoked_at, now + 1);
  assert.equal(db.prepare("SELECT revoked_at FROM private_access_tokens WHERE id='alternate'").get().revoked_at, now + 1);
});
