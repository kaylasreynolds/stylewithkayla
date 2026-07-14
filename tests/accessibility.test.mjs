import assert from "node:assert/strict";import{readFile}from"node:fs/promises";import test from"node:test";
const profile=await readFile(new URL("../app/style-profile/page.tsx",import.meta.url),"utf8"),booking=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8"),actions=await readFile(new URL("../app/client-actions/page.tsx",import.meta.url),"utf8");
test("interactive profile choices expose selected state and button type",()=>{assert.match(profile,/aria-pressed=/);assert.match(profile,/type="button"/);assert.match(profile,/aria-label=/);});
test("booking and private flows expose live errors",()=>{for(const source of[booking,profile,actions])assert.match(source,/role="alert"/);});
test("private routes show safe missing-link and expired-link states",()=>{assert.match(profile,/Private link required/);assert.match(profile,/Link unavailable/);assert.match(actions,/Private link required/);assert.match(actions,/Link unavailable/);});
test("client content is never injected as raw HTML",()=>{for(const source of[booking,profile,actions])assert.doesNotMatch(source,/dangerouslySetInnerHTML/);});
