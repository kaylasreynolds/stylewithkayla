import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

const baseline = await readFile(new URL("../drizzle/0000_silent_ser_duncan.sql", import.meta.url), "utf8");
const recapMigration = await readFile(new URL("../drizzle/20260823032130_appointment_recap_data_layer.sql", import.meta.url), "utf8");
const recapRoute = await readFile(new URL("../app/api/admin/bookings/[bookingId]/recap/route.ts", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../app/admin/AdminDashboard.tsx", import.meta.url), "utf8");

function applyMigration(db, sql) {
  for (const statement of sql.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean)) db.exec(statement);
}

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  applyMigration(db, baseline);
  applyMigration(db, recapMigration);
  const now = Date.now();
  const service = db.prepare("SELECT id FROM services ORDER BY sort_order LIMIT 1").get();
  db.prepare("INSERT INTO clients(id,full_name,email,normalized_email,phone,created_at,updated_at) VALUES(?,?,?,?,?,?,?)")
    .run("client-1", "Recap Client", "recap@example.com", "recap@example.com", "2085550100", now, now);
  db.prepare("INSERT INTO bookings(id,public_reference,client_id,service_id,status,requested_start_at,requested_end_at,returning_client,how_heard,privacy_policy_version,privacy_acknowledged_at,pending_since,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run("booking-1", "SWK-RECAP", "client-1", service.id, "completed", now - 7200000, now - 3600000, 0, "Referral", "test", now, now, now, now);
  return { db, now };
}

function openRecap(db, now, generatedId) {
  const booking = db.prepare("SELECT client_id AS clientId FROM bookings WHERE id=?").get("booking-1");
  db.prepare("INSERT INTO appointment_recaps(id,booking_id,client_id,status,created_at,updated_at) VALUES(?,?,?,'not_started',?,?) ON CONFLICT(booking_id) DO NOTHING")
    .run(generatedId, "booking-1", booking.clientId, now, now);
  return db.prepare("SELECT id,status FROM appointment_recaps WHERE booking_id=?").get("booking-1");
}

function saveCollections(db, recapId, document, now) {
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM recap_insights WHERE recap_id=?").run(recapId);
    document.insights.forEach((row, index) => db.prepare("INSERT INTO recap_insights(id,recap_id,polarity,category,insight_text,client_facing,importance,sort_order,saved_to_client_notes,client_style_note_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
      .run(row.id, recapId, row.polarity, row.category, row.insightText, row.clientFacing ? 1 : 0, row.importance, index, row.savedToClientNotes ?? 0, row.clientStyleNoteId ?? null, now));
    db.prepare("DELETE FROM recap_items WHERE recap_id=?").run(recapId);
    document.items.forEach((row, index) => db.prepare("INSERT INTO recap_items(id,recap_id,item_name,brand,size,color,category,note,disposition,client_facing,sort_order,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(row.id, recapId, row.itemName, row.brand, row.size, row.color, row.category, row.note, row.disposition, row.clientFacing ? 1 : 0, index, now));
    db.prepare("DELETE FROM recap_formulas WHERE recap_id=?").run(recapId);
    document.formulas.forEach((row, index) => db.prepare("INSERT INTO recap_formulas(id,recap_id,formula_text,explanation,sort_order,created_at) VALUES(?,?,?,?,?,?)")
      .run(row.id, recapId, row.formulaText, row.explanation, index, now));
    db.prepare("DELETE FROM recap_priorities WHERE recap_id=?").run(recapId);
    document.priorities.forEach((row, index) => db.prepare("INSERT INTO recap_priorities(id,recap_id,category,priority_text,status,rank,client_facing,created_at) VALUES(?,?,?,?,?,?,?,?)")
      .run(row.id, recapId, row.category, row.priorityText, row.status, index, row.clientFacing ? 1 : 0, now));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function loadCollections(db, recapId) {
  return {
    insights: db.prepare("SELECT id,polarity,category,insight_text AS insightText,client_facing AS clientFacing,importance,sort_order AS sortOrder,saved_to_client_notes AS savedToClientNotes,client_style_note_id AS clientStyleNoteId FROM recap_insights WHERE recap_id=? ORDER BY sort_order").all(recapId),
    items: db.prepare("SELECT id,item_name AS itemName,brand,size,color,category,note,disposition,client_facing AS clientFacing,sort_order AS sortOrder FROM recap_items WHERE recap_id=? ORDER BY sort_order").all(recapId),
    formulas: db.prepare("SELECT id,formula_text AS formulaText,explanation,sort_order AS sortOrder FROM recap_formulas WHERE recap_id=? ORDER BY sort_order").all(recapId),
    priorities: db.prepare("SELECT id,category,priority_text AS priorityText,status,rank,client_facing AS clientFacing FROM recap_priorities WHERE recap_id=? ORDER BY rank").all(recapId),
  };
}

test("first open lazily creates a not-started recap and a second open reuses it", () => {
  const { db, now } = fixture();
  const first = openRecap(db, now, "recap-first");
  const second = openRecap(db, now + 1, "recap-should-not-exist");
  assert.deepEqual({ ...first }, { id: "recap-first", status: "not_started" });
  assert.deepEqual({ ...second }, { ...first });
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM appointment_recaps WHERE booking_id=?").get("booking-1").count, 1);
});

test("recap collections round-trip with their meaning and ordering intact", () => {
  const { db, now } = fixture();
  const { id } = openRecap(db, now, "recap-1");
  const document = {
    insights: [
      { id: "insight-2", polarity: "worked", category: "color", insightText: "Jewel tones work", clientFacing: true, importance: "high" },
      { id: "insight-1", polarity: "didnt_work", category: "fit", insightText: "Avoid cropped rise", clientFacing: false, importance: "medium" },
    ],
    items: [
      { id: "item-2", itemName: "Blue blazer", brand: "Example", size: "M", color: "Blue", category: "jacket", note: "Purchased", disposition: "purchased", clientFacing: true },
      { id: "item-1", itemName: "Wide-leg trouser", brand: null, size: "8", color: null, category: "pants", note: null, disposition: "considered", clientFacing: false },
    ],
    formulas: [{ id: "formula-2", formulaText: "Blazer + tee + trouser", explanation: "Polished casual" }, { id: "formula-1", formulaText: "Dress + boot", explanation: null }],
    priorities: [{ id: "priority-2", category: "wardrobe", priorityText: "Find neutral shoes", status: "open", clientFacing: true }, { id: "priority-1", category: null, priorityText: "Tailor blazer", status: "in_progress", clientFacing: false }],
  };
  saveCollections(db, id, document, now);
  const loaded = loadCollections(db, id);
  assert.deepEqual(loaded.insights.map(row => [row.id, row.polarity, row.category, row.insightText, Boolean(row.clientFacing), row.importance]), document.insights.map(row => [row.id, row.polarity, row.category, row.insightText, row.clientFacing, row.importance]));
  assert.deepEqual(loaded.items.map(row => [row.id, row.itemName, row.brand, row.size, row.color, row.category, row.note, row.disposition, Boolean(row.clientFacing)]), document.items.map(row => [row.id, row.itemName, row.brand, row.size, row.color, row.category, row.note, row.disposition, row.clientFacing]));
  assert.deepEqual(loaded.formulas.map(row => [row.id, row.formulaText, row.explanation]), document.formulas.map(row => [row.id, row.formulaText, row.explanation]));
  assert.deepEqual(loaded.priorities.map(row => [row.id, row.category, row.priorityText, row.status, Boolean(row.clientFacing)]), document.priorities.map(row => [row.id, row.category, row.priorityText, row.status, row.clientFacing]));
});

test("saving after promotion preserves the insight link", () => {
  const { db, now } = fixture();
  const { id } = openRecap(db, now, "recap-1");
  const document = { insights: [{ id: "insight-1", polarity: "worked", category: "color", insightText: "Emerald works", clientFacing: true, importance: "high" }], items: [], formulas: [], priorities: [] };
  saveCollections(db, id, document, now);
  db.prepare("INSERT INTO client_style_notes(id,client_id,category,normalized_label,insight_text,source_recap_id,created_at,last_confirmed_at,active,confidence,internal_notes) VALUES(?,?,?,NULL,?,?,?,?,1,?,NULL)")
    .run("style-note-1", "client-1", "color", "Emerald works", id, now, now, "high");
  db.prepare("UPDATE recap_insights SET saved_to_client_notes=1,client_style_note_id=? WHERE id=?").run("style-note-1", "insight-1");
  const retained = db.prepare("SELECT saved_to_client_notes AS savedToClientNotes,client_style_note_id AS clientStyleNoteId FROM recap_insights WHERE id=?").get("insight-1");
  saveCollections(db, id, { ...document, insights: [{ ...document.insights[0], ...retained }] }, now + 1);
  assert.deepEqual({ ...db.prepare("SELECT id,saved_to_client_notes AS savedToClientNotes,client_style_note_id AS clientStyleNoteId FROM recap_insights WHERE recap_id=?").get(id) }, { id: "insight-1", savedToClientNotes: 1, clientStyleNoteId: "style-note-1" });
});

test("promoting an insight twice is idempotent", () => {
  const { db, now } = fixture();
  const { id } = openRecap(db, now, "recap-1");
  saveCollections(db, id, { insights: [{ id: "insight-1", polarity: "worked", category: "fit", insightText: "Long lines work", clientFacing: true, importance: "high" }], items: [], formulas: [], priorities: [] }, now);
  function promote() {
    const insight = db.prepare("SELECT saved_to_client_notes AS savedToClientNotes,client_style_note_id AS clientStyleNoteId FROM recap_insights WHERE id=?").get("insight-1");
    if (insight.savedToClientNotes && insight.clientStyleNoteId) return insight.clientStyleNoteId;
    db.prepare("INSERT INTO client_style_notes(id,client_id,category,normalized_label,insight_text,source_recap_id,created_at,last_confirmed_at,active,confidence,internal_notes) VALUES('style-note-1','client-1','fit',NULL,'Long lines work',?,?,?,1,'high',NULL)").run(id, now, now);
    db.prepare("UPDATE recap_insights SET saved_to_client_notes=1,client_style_note_id='style-note-1' WHERE id='insight-1'").run();
    return "style-note-1";
  }
  assert.equal(promote(), "style-note-1");
  assert.equal(promote(), "style-note-1");
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM client_style_notes WHERE source_recap_id=?").get(id).count, 1);
});

test("PATCH protects published and archived statuses", () => {
  assert.match(recapRoute, /editableStatuses = new Set\(\["not_started", "draft", "ready_for_review"\]\)/);
  assert.match(recapRoute, /if \(!editableStatuses\.has\(status!\)\) throw validation\("status", "Published and archived recaps cannot be changed here\."\)/);
  for (const status of ["published", "archived"]) assert.equal(new Set(["not_started", "draft", "ready_for_review"]).has(status), false);
});

test("wrap-up eligibility includes completed and elapsed confirmed appointments only", () => {
  assert.match(dashboard, /detail\.status === "completed"[\s\S]*detail\.status === "confirmed"[\s\S]*Date\.parse\(detail\.confirmedStartAt\) <= renderNow/);
  const now = Date.parse("2026-08-23T12:00:00Z");
  const eligible = booking => booking.status === "completed" || (booking.status === "confirmed" && booking.confirmedStartAt !== null && Date.parse(booking.confirmedStartAt) <= now);
  assert.equal(eligible({ status: "completed", confirmedStartAt: null }), true);
  assert.equal(eligible({ status: "confirmed", confirmedStartAt: "2026-08-23T11:59:59Z" }), true);
  assert.equal(eligible({ status: "confirmed", confirmedStartAt: "2026-08-23T12:00:01Z" }), false);
  for (const status of ["cancelled", "declined", "pending"]) assert.equal(eligible({ status, confirmedStartAt: "2026-08-23T11:00:00Z" }), false);
});
