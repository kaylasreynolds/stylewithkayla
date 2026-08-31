import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StyleSummarySections } from "../components/StyleSummarySections";
import { ApiError } from "../lib/server/http";
import { findRecapSummaryAccess } from "../lib/server/recap-access";
import { buildRecapSummaryContent, RECAP_SUMMARY_TOKEN_TTL_MS } from "../lib/server/recap-policy";
import { publishRecapSummary } from "../lib/server/recap-publication";

const baseline = readFileSync(new URL("../drizzle/0000_silent_ser_duncan.sql", import.meta.url), "utf8");
const migration = readFileSync(new URL("../drizzle/20260823032130_appointment_recap_data_layer.sql", import.meta.url), "utf8");
const publishRoute = readFileSync(new URL("../app/api/admin/bookings/[bookingId]/recap/publish/route.ts", import.meta.url), "utf8");
const publicRoute = readFileSync(new URL("../app/api/style-summary/[token]/route.ts", import.meta.url), "utf8");

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
  const insights = db.prepare("SELECT polarity,category,insight_text AS insightText,client_facing AS clientFacing FROM recap_insights WHERE recap_id='recap-summary' ORDER BY sort_order").all();
  const items = db.prepare("SELECT item_name AS itemName,brand,size,color,note,client_facing AS clientFacing FROM recap_items WHERE recap_id='recap-summary' ORDER BY sort_order").all();
  const formulas = db.prepare("SELECT formula_text AS formulaText,explanation FROM recap_formulas WHERE recap_id='recap-summary' ORDER BY sort_order").all();
  const priorities = db.prepare("SELECT category,priority_text AS priorityText,rank,client_facing AS clientFacing FROM recap_priorities WHERE recap_id='recap-summary' ORDER BY rank").all();
  return buildRecapSummaryContent(recap, insights, items, formulas, priorities, {fullName:"Jamie Client"}, {confirmedStartAt:"2026-08-23T16:00:00.000Z"}, {name:serviceName});
}
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
function d1(database: DatabaseSync): D1Database {
  class Prepared {
    values: SQLInputValue[] = [];
    constructor(readonly sql: string) {}
    bind(...values: SQLInputValue[]) { this.values = values; return this; }
    async first<T>() { return (database.prepare(this.sql).get(...this.values) ?? null) as T | null; }
    async all<T>() { return { results: database.prepare(this.sql).all(...this.values) as T[] }; }
    run() { const result = database.prepare(this.sql).run(...this.values); return { success: true, meta: { changes: Number(result.changes) }, results: [] }; }
  }
  return { prepare: (sql: string) => new Prepared(sql), batch: async (statements: Prepared[]) => { database.exec("BEGIN IMMEDIATE"); try { const results = statements.map(statement => statement.run()); database.exec("COMMIT"); return results; } catch (error) { database.exec("ROLLBACK"); throw error; } } } as unknown as D1Database;
}
let idSequence = 0;
async function publish(db: DatabaseSync, now: number, serviceName: string, raw = "r".repeat(43)) {
  return publishRecapSummary({ db: d1(db), bookingId: "booking-summary", recapId: "recap-summary", recipient: "jamie@example.com", content: liveContent(db, serviceName), origin: "https://style.test" }, { now: () => now, id: () => `generated-${++idSequence}`, rawToken: () => raw, hashToken: async value => hash(value) });
}
async function access(db: DatabaseSync, raw: string, at: number) {
  const row = await findRecapSummaryAccess(d1(db), raw, at, async value => hash(value));
  const summary = db.prepare("SELECT content FROM recap_summaries WHERE id=?").get(row.recapSummaryId) as {content:string};
  return JSON.parse(summary.content);
}

test("preview and publication share the sole client-facing projection", () => {
  const {db, service} = fixture(), content = liveContent(db, service.name);
  assert.equal(content.client.firstName, "Jamie"); assert.deepEqual(content.insights, [{polarity:"worked",category:"color",insightText:"Emerald brightens your palette"}]);
  assert.deepEqual(content.items.map(item => item.itemName), ["Navy blazer"]); assert.equal(JSON.stringify(content).includes("PRIVATE"), false); assert.equal(content.formulas.length, 1); assert.equal(content.priorities.length, 1);
  assert.match(publishRoute, /buildRecapSummaryContent\(/); assert.doesNotMatch(publicRoute, /buildRecapSummaryContent/);
});

test("published content remains byte-for-byte frozen after live recap edits", async () => {
  const {db, now, service} = fixture(), raw = "i".repeat(43), first = await publish(db, now, service.name, raw); assert.equal(first.status, "published");
  const frozen = JSON.stringify(await access(db, raw, now+1));
  db.prepare("UPDATE appointment_recaps SET what_we_solved='CHANGED',kayla_note='CHANGED' WHERE id='recap-summary'").run(); db.prepare("UPDATE recap_insights SET insight_text='CHANGED' WHERE id='public-insight'").run();
  const after = await access(db, raw, now+2); assert.equal(JSON.stringify(after), frozen); assert.equal(JSON.stringify(after).includes("CHANGED"), false);
});

test("production publication guard lets only one caller write", async () => {
  const {db, now, service} = fixture(); assert.equal((await publish(db, now, service.name)).status, "published");
  await assert.rejects(publish(db, now+1, service.name, "s".repeat(43)), (error: unknown) => error instanceof ApiError && error.status === 409 && error.code === "ALREADY_PUBLISHED");
  assert.equal((db.prepare("SELECT COUNT(*) count FROM recap_summaries").get() as {count:number}).count, 1); assert.equal((db.prepare("SELECT COUNT(*) count FROM private_access_tokens WHERE purpose='recap_summary' AND revoked_at IS NULL").get() as {count:number}).count, 1);
});

test("production summary access enforces purpose, expiration, and revocation while storing only a hash", async () => {
  const {db, now, service} = fixture(), raw = "a".repeat(43); await publish(db, now, service.name, raw);
  assert.equal((await findRecapSummaryAccess(d1(db),raw,now+1,async value=>hash(value))).bookingId,"booking-summary"); assert.equal((db.prepare("SELECT COUNT(*) count FROM private_access_tokens WHERE token_hash=?").get(raw) as {count:number}).count, 0);
  db.prepare("INSERT INTO private_access_tokens(id,booking_id,purpose,token_hash,expires_at,created_at) VALUES('wrong-purpose','booking-summary','style_profile',?,?,?)").run(hash("x".repeat(43)),now+1000,now);
  await assert.rejects(findRecapSummaryAccess(d1(db),"x".repeat(43),now+1,async value=>hash(value)),(error:unknown)=>error instanceof ApiError&&error.status===404);
  await assert.rejects(findRecapSummaryAccess(d1(db),raw,now+RECAP_SUMMARY_TOKEN_TTL_MS,async value=>hash(value)),(error:unknown)=>error instanceof ApiError&&error.status===410);
  db.prepare("UPDATE private_access_tokens SET revoked_at=? WHERE token_hash=?").run(now+2,hash(raw)); await assert.rejects(findRecapSummaryAccess(d1(db),raw,now+3,async value=>hash(value)),(error:unknown)=>error instanceof ApiError&&error.status===410);
});

test("rendering guards omit every empty optional section", () => {
  const markup = renderToStaticMarkup(createElement(StyleSummarySections,{content:{client:{firstName:"Jamie",appointmentDate:null,serviceName:"Personal Styling"},whatWeSolved:null,insights:[],formulas:[],items:[],priorities:[],kaylaNote:null,nextStylingMoment:null}}));
  for (const heading of ["What We Worked On","What We Learned","Your Outfit Formulas","What We Added","Your Wardrobe Roadmap","A Note From Kayla","Your Next Styling Moment"]) assert.equal(markup.includes(heading),false);
  assert.equal((markup.match(/<section/g)??[]).length,0);
});

test("summary rendering preserves links, signature, semantics, and repeated content", () => {
  const { db, service } = fixture();
  db.prepare("INSERT INTO recap_insights(id,recap_id,polarity,category,insight_text,client_facing,sort_order,created_at) VALUES('second-insight','recap-summary','worked','color','Rose is another favorite',1,2,0)").run();
  db.prepare("INSERT INTO recap_formulas(id,recap_id,formula_text,explanation,sort_order,created_at) VALUES('second-formula','recap-summary','Dress + flats','Keep this free text',1,0)").run();
  db.prepare("INSERT INTO recap_priorities(id,recap_id,category,priority_text,status,rank,client_facing,created_at) VALUES('second-priority','recap-summary','Later','Tailor the trousers','open',1,1,0)").run();
  const markup = renderToStaticMarkup(
    createElement(StyleSummarySections, { content: liveContent(db, service.name) }),
  );

  for (const text of ["Emerald brightens your palette", "Rose is another favorite", "Blazer + tee + trouser", "Dress + flats", "Add a neutral shoe", "Tailor the trousers"]) {
    assert.match(markup, new RegExp(text.replaceAll("+", "\\+")));
  }
  assert.match(markup, /<ul class="style-summary-formulas"/);
  assert.doesNotMatch(markup, /style-summary-index/);
  assert.match(markup, /<ol class="style-summary-roadmap"/);
  assert.match(markup, /href="\/book"/);
  assert.match(markup, /src="\/images\/kayla-bl\.png"/);
  assert.match(markup, /See you soon,/);
});

test("new outfit formula fields render in order while empty fields are omitted", () => {
  const formulas = [
    { title: "Elevated Denim", equation: "Top + Denim + Shoe", whyItWorks: "Comfort with polish.", tryText: "Jeans and loafers." },
    { title: "Custom", equation: "Dress + Flats", whyItWorks: "", tryText: "" },
  ];
  const content = buildRecapSummaryContent({}, [], [], formulas, [], { fullName: "Jamie" }, {}, { name: "Styling" });
  const markup = renderToStaticMarkup(createElement(StyleSummarySections, { content }));
  assert.ok(markup.indexOf("Elevated Denim") < markup.indexOf("Custom"));
  for (const value of ["Top + Denim + Shoe", "Comfort with polish.", "Try:</strong> Jeans and loafers.", "Dress + Flats"]) assert.match(markup, new RegExp(value.replaceAll("+", "\\+")));
  assert.equal((markup.match(/Try:<\/strong>/g) ?? []).length, 1);
  assert.doesNotMatch(markup, /style-summary-index|Formula 1|Formula 2/);
});

test("what we learned renders equal polarity cards with category icons", () => {
  const { db, service } = fixture();
  db.prepare("UPDATE recap_insights SET client_facing=1 WHERE id='private-insight'").run();
  const markup = renderToStaticMarkup(createElement(StyleSummarySections, { content: liveContent(db, service.name) }));
  assert.match(markup, /Compliments You/);
  assert.match(markup, /Less Flattering/);
  assert.match(markup, /style-summary-insight-card--complimentary/);
  assert.match(markup, /style-summary-insight-card--less-flattering/);
  assert.match(markup, /src="\/images\/pantone\.png"/);
  assert.match(markup, /src="\/images\/measurement\.png"/);
  assert.match(markup, /COLOR<\/strong><span[^>]*> – <\/span>Emerald brightens your palette/i);
});
