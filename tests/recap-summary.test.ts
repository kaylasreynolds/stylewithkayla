import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { buildRecapSummaryContent, RECAP_SUMMARY_TOKEN_TTL_MS } from "../lib/server/recap-policy";

const baseline = readFileSync(new URL("../drizzle/0000_silent_ser_duncan.sql", import.meta.url), "utf8");
const migration = readFileSync(new URL("../drizzle/20260823032130_appointment_recap_data_layer.sql", import.meta.url), "utf8");
const publishRoute = readFileSync(new URL("../app/api/admin/bookings/[bookingId]/recap/publish/route.ts", import.meta.url), "utf8");
const publicRoute = readFileSync(new URL("../app/api/style-summary/[token]/route.ts", import.meta.url), "utf8");
const sections = readFileSync(new URL("../components/StyleSummarySections.tsx", import.meta.url), "utf8");

function apply(db: DatabaseSync, sql: string) { for (const statement of sql.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean)) db.exec(statement); }
function fixture() {
  const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys=ON"); apply(db, baseline); apply(db, migration);
  const now = Date.parse("2026-08-23T18:00:00Z"), service = db.prepare("SELECT id,name FROM services ORDER BY sort_order LIMIT 1").get() as {id:string;name:string};
  db.prepare("INSERT INTO clients(id,full_name,email,normalized_email,phone,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").run("client-summary", "Jamie Client", "jamie@example.com", "jamie@example.com", "2085550100", now, now);
  db.prepare("INSERT INTO bookings(id,public_reference,client_id,service_id,status,requested_start_at,requested_end_at,confirmed_start_at,confirmed_end_at,returning_client,how_heard,privacy_policy_version,privacy_acknowledged_at,pending_since,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run("booking-summary", "SWK-SUM", "client-summary", service.id, "completed", now-7200000, now-3600000, now-7200000, now-3600000, 0, "Referral", "test", now, now, now, now);
  db.prepare("INSERT INTO appointment_recaps(id,booking_id,client_id,status,what_we_solved,kayla_note,next_moment_service_type,next_moment_timing,next_moment_reason,next_moment_booking_cta_enabled,private_follow_up_note,created_at,updated_at) VALUES(?,?,?,'ready_for_review',?,?,?,?,?,?,?, ?,?)").run("recap-summary", "booking-summary", "client-summary", "A flexible work-to-weekend wardrobe", "Keep trusting the clean lines that make you feel confident.", "Closet Edit", "This fall", "Build on today’s versatile foundation", 1, "PRIVATE: discuss budget", now, now);
  db.prepare("INSERT INTO recap_insights(id,recap_id,polarity,category,insight_text,client_facing,sort_order,created_at) VALUES('public-insight','recap-summary','worked','color','Emerald brightens your palette',1,0,?),('private-insight','recap-summary','didnt_work','size','PRIVATE fit observation',0,1,?)").run(now, now);
  db.prepare("INSERT INTO recap_items(id,recap_id,item_name,note,disposition,client_facing,sort_order,created_at) VALUES('public-item','recap-summary','Navy blazer','Works across occasions','purchased',1,0,?),('private-item','recap-summary','Internal item',NULL,'considered',0,1,?)").run(now, now);
  db.prepare("INSERT INTO recap_formulas(id,recap_id,formula_text,explanation,sort_order,created_at) VALUES('formula','recap-summary','Blazer + tee + trouser','Polished and easy',0,?)").run(now);
  db.prepare("INSERT INTO recap_priorities(id,recap_id,priority_text,status,rank,client_facing,created_at) VALUES('priority','recap-summary','Add a neutral shoe','open',0,1,?)").run(now);
  return {db, now, service};
}
function liveContent(db: DatabaseSync, serviceName: string) {
  const recap = db.prepare("SELECT what_we_solved AS whatWeSolved,kayla_note AS kaylaNote,next_moment_service_type AS nextMomentServiceType,next_moment_timing AS nextMomentTiming,next_moment_reason AS nextMomentReason,next_moment_booking_cta_enabled AS nextMomentBookingCtaEnabled FROM appointment_recaps WHERE id='recap-summary'").get()!;
  const insights = db.prepare("SELECT category,insight_text AS insightText,client_facing AS clientFacing FROM recap_insights WHERE recap_id='recap-summary' ORDER BY sort_order").all();
  const items = db.prepare("SELECT item_name AS itemName,brand,size,color,note,client_facing AS clientFacing FROM recap_items WHERE recap_id='recap-summary' ORDER BY sort_order").all();
  const formulas = db.prepare("SELECT formula_text AS formulaText,explanation FROM recap_formulas WHERE recap_id='recap-summary' ORDER BY sort_order").all();
  const priorities = db.prepare("SELECT category,priority_text AS priorityText,rank,client_facing AS clientFacing FROM recap_priorities WHERE recap_id='recap-summary' ORDER BY rank").all();
  return buildRecapSummaryContent(recap, insights, items, formulas, priorities, {fullName:"Jamie Client"}, {confirmedStartAt:"2026-08-23T16:00:00.000Z"}, {name:serviceName});
}
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
function publish(db: DatabaseSync, now: number, serviceName: string) {
  const recap = db.prepare("SELECT status FROM appointment_recaps WHERE id='recap-summary'").get() as {status:string};
  if (recap.status === "published") return {status:409, code:"ALREADY_PUBLISHED"};
  const content = liveContent(db, serviceName), raw = randomBytes(32).toString("base64url"), summaryId = `summary-${now}`;
  db.exec("BEGIN"); try {
    db.prepare("INSERT INTO recap_summaries(id,recap_id,version,content,sent_at,recipient,created_at) VALUES(?,?,COALESCE((SELECT MAX(version)+1 FROM recap_summaries WHERE recap_id=?),1),?,?,?,?)").run(summaryId,"recap-summary","recap-summary",JSON.stringify(content),now,"jamie@example.com",now);
    db.prepare("UPDATE appointment_recaps SET status='published',updated_at=? WHERE id='recap-summary'").run(now);
    db.prepare("UPDATE private_access_tokens SET revoked_at=? WHERE booking_id='booking-summary' AND purpose='recap_summary' AND revoked_at IS NULL").run(now);
    db.prepare("INSERT INTO private_access_tokens(id,booking_id,recap_summary_id,purpose,token_hash,expires_at,created_at) VALUES(?,?,?,'recap_summary',?,?,?)").run(`token-${now}`,"booking-summary",summaryId,hash(raw),now+RECAP_SUMMARY_TOKEN_TTL_MS,now);
    db.exec("COMMIT"); return {status:200, raw, content};
  } catch(error) { db.exec("ROLLBACK"); throw error; }
}
function access(db: DatabaseSync, raw: string, at: number) {
  const row = db.prepare("SELECT recap_summary_id AS summaryId,expires_at AS expiresAt,revoked_at AS revokedAt FROM private_access_tokens WHERE token_hash=? AND purpose='recap_summary'").get(hash(raw)) as {summaryId:string;expiresAt:number;revokedAt:number|null}|undefined;
  if (!row) return {status:404}; if (row.revokedAt || row.expiresAt <= at) return {status:410};
  const summary = db.prepare("SELECT content FROM recap_summaries WHERE id=?").get(row.summaryId) as {content:string}|undefined; return summary ? {status:200, content:JSON.parse(summary.content)} : {status:404};
}

test("preview and publication share the sole client-facing projection", () => {
  const {db, service} = fixture(), content = liveContent(db, service.name);
  assert.equal(content.client.firstName, "Jamie"); assert.deepEqual(content.insights, [{category:"color",insightText:"Emerald brightens your palette"}]);
  assert.deepEqual(content.items.map(item => item.itemName), ["Navy blazer"]); assert.equal(JSON.stringify(content).includes("PRIVATE"), false); assert.equal(content.formulas.length, 1); assert.equal(content.priorities.length, 1);
  assert.match(publishRoute, /buildRecapSummaryContent\(/); assert.doesNotMatch(publicRoute, /buildRecapSummaryContent/);
});

test("published content remains byte-for-byte frozen after live recap edits", () => {
  const {db, now, service} = fixture(), first = publish(db, now, service.name); assert.equal(first.status, 200);
  const before = access(db, first.raw!, now+1); assert.equal(before.status, 200); const frozen = JSON.stringify(before.content);
  db.prepare("UPDATE appointment_recaps SET what_we_solved='CHANGED',kayla_note='CHANGED' WHERE id='recap-summary'").run(); db.prepare("UPDATE recap_insights SET insight_text='CHANGED' WHERE id='public-insight'").run();
  const after = access(db, first.raw!, now+2); assert.equal(JSON.stringify(after.content), frozen); assert.equal(JSON.stringify(after.content).includes("CHANGED"), false);
});

test("publish is idempotent and creates one snapshot and one active token", () => {
  const {db, now, service} = fixture(); assert.equal(publish(db, now, service.name).status, 200); assert.deepEqual(publish(db, now+1, service.name), {status:409,code:"ALREADY_PUBLISHED"});
  assert.equal((db.prepare("SELECT COUNT(*) count FROM recap_summaries").get() as {count:number}).count, 1); assert.equal((db.prepare("SELECT COUNT(*) count FROM private_access_tokens WHERE purpose='recap_summary' AND revoked_at IS NULL").get() as {count:number}).count, 1);
});

test("summary access enforces purpose, expiration, and revocation while storing only a hash", () => {
  const {db, now, service} = fixture(), result = publish(db, now, service.name); const raw = result.raw!;
  assert.equal(access(db, raw, now+1).status, 200); assert.equal((db.prepare("SELECT COUNT(*) count FROM private_access_tokens WHERE token_hash=?").get(raw) as {count:number}).count, 0);
  db.prepare("INSERT INTO private_access_tokens(id,booking_id,purpose,token_hash,expires_at,created_at) VALUES('wrong-purpose','booking-summary','style_profile',?,?,?)").run(hash("x".repeat(43)),now+1000,now); assert.equal(access(db,"x".repeat(43),now+1).status,404);
  assert.equal(access(db,raw,now+RECAP_SUMMARY_TOKEN_TTL_MS).status,410); db.prepare("UPDATE private_access_tokens SET revoked_at=? WHERE token_hash=?").run(now+2,hash(raw)); assert.equal(access(db,raw,now+3).status,410);
});

test("rendering guards omit every empty optional section", () => {
  for (const guard of ["content.insights.length > 0", "content.formulas.length > 0", "content.items.length > 0", "content.priorities.length > 0", "content.kaylaNote &&", "content.nextStylingMoment &&"]) assert.match(sections, new RegExp(guard.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
});
