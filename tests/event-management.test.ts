import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  capacityAvailable,
  canTransitionEvent,
  csvCell,
  eventJson,
  materializeTimes,
  materializeDraftTimes,
  parseDate,
  parseEvent,
  parseEventDraft,
  parseTime,
  rangesOverlap,
  validateForPublish,
  zonedInstant,
} from "../lib/server/event-management";
import { eventDateToPickerValue, formatEventSchedule, isValidEventDate, pickerValueToEventDate } from "../lib/event-date-time";

import {
  instant,
  publicEventJson,
} from "../lib/server/event-management-core";

import { requireAdmin } from "../lib/server/admin-auth";
import {
  EVENT_IMAGE_MAX_BYTES,
  eventAssetOwnedBy,
  inspectEventImage,
  meaningfulAlt,
} from "../lib/server/event-images";

const complete = {
  title: "Fall styling",
  eventLabel: "Workshop",
  customLabel: "",
  shortDescription: "An evening of personal styling.",
  description: "Full details",
  offer: "Gift with purchase",
  offerDetails: "While supplies last",
  offerTerms: "Terms",
  eventDate: "09/27/26",
  startTime: "6:00 PM",
  endTime: "8:00 PM",
  allDay: false,
  timezone: "America/Boise",
  location: "Macy's Boise",
  locationDetails: "Second floor",
  directionsUrl: "https://example.com/map",
  attendanceType: "general_rsvp",
  capacity: 40,
  unlimitedCapacity: false,
  maxGuests: 2,
  allowGuestNames: true,
  registrationOpensDate: "09/01/26",
  registrationOpensTime: "9:00 AM",
  registrationClosesDate: "09/27/26",
  registrationClosesTime: "5:00 PM",
  allowDuplicateRegistration: false,
  appointmentRequired: false,
  appointmentRecommended: false,
  costType: "complimentary",
  costLabel: "Complimentary",
  ctaLabel: "Save My Spot",
  ctaAction: "registration",
  ctaUrl: "",
  ctaEmail: "",
  ctaPhone: "",
  sharingEnabled: true,
  shareMessage: "",
  imageAssetId: "asset-1",
  imageAlt: "Kayla welcoming guests at a styling event",
};
test("brand-new blank and incomplete event drafts retain safe raw values",()=>{
  const blank=parseEventDraft({});
  assert.equal(blank.title,"");
  const cases=[
    {title:""},
    {eventDate:"08/"},
    {eventDate:"08/15/26",startTime:"",endTime:""},
    {eventDate:"08/15/26",startTime:"6:",endTime:""},
    {costType:"paid",costLabel:""},
    {eventLabel:"Custom",customLabel:""},
    {attendanceType:"general_rsvp",capacity:null},
    {ctaAction:"external_url",ctaUrl:"https://"},
    {registrationOpensDate:"08/",registrationOpensTime:""},
    {imageAlt:"x",offer:"Buy",offerDetails:"unfinished",offerTerms:""},
  ];
  for(const input of cases)assert.deepEqual(parseEventDraft(input),{...blank,...input});
  assert.throws(()=>parseEventDraft({unknown:true}),/unexpected field/i);
  assert.throws(()=>parseEventDraft({title:42}),/highlighted fields/i);
  assert.throws(()=>parseEventDraft({title:"x".repeat(161)}),/highlighted fields/i);
});

test("draft timing materialization never parses unfinished text and clears stale derived values",()=>{
  for(const timing of [
    {eventDate:"08/",startTime:"",endTime:""},
    {eventDate:"08/15/26",startTime:"",endTime:""},
    {eventDate:"08/15/26",startTime:"6:00 PM",endTime:""},
  ])assert.deepEqual(materializeDraftTimes({...parseEventDraft({}),...timing}),{startsAt:0,endsAt:1,registrationOpensAt:null,registrationClosesAt:null});
  const raw={...complete,startTime:"6:05 pm",endTime:"8:30 pm"};
  const times=materializeDraftTimes(raw);
  assert.equal(new Date(times.startsAt).toISOString(),"2026-09-28T00:05:00.000Z");
  assert.equal(raw.startTime,"6:05 pm");
  const incompleteWindow=materializeDraftTimes({...complete,registrationOpensDate:"08/",registrationOpensTime:""});
  assert.notEqual(incompleteWindow.startsAt,0);
  assert.equal(incompleteWindow.registrationOpensAt,null);
});

test("unfinished draft fields survive database-shaped reloads without inventing capacity",()=>{
  const reloaded=eventJson({
    id:"draft-1",status:"draft",title:"Idea",event_date:"08/",start_time:"6:",end_time:"",
    cost_type:"paid",cost_label:"",category:"Custom",custom_label:"",attendance_type:"general_rsvp",
    capacity:0,cta_action:"external_url",cta_url:"https://",registration_opens_date:"08/",
    starts_at:0,ends_at:1,created_at:0,updated_at:0,
  });
  assert.equal(reloaded.eventDate,"08/");
  assert.equal(reloaded.startTime,"6:");
  assert.equal(reloaded.costLabel,"");
  assert.equal(reloaded.customLabel,"");
  assert.equal(reloaded.capacity,null);
  assert.equal(reloaded.ctaUrl,"https://");
  assert.equal(reloaded.registrationOpensDate,"08/");
});

test("publish rejects every draft-incomplete state with a field-specific error",()=>{
  const cases:[Record<string,unknown>,string][]=[
    [{title:""},"title"],
    [{eventDate:"08/"},"eventDate"],
    [{startTime:"",endTime:""},"startTime"],
    [{startTime:"6:00 PM",endTime:""},"endTime"],
    [{costType:"paid",costLabel:""},"costLabel"],
    [{eventLabel:"Custom",customLabel:""},"customLabel"],
    [{attendanceType:"general_rsvp",capacity:null,unlimitedCapacity:false},"capacity"],
    [{ctaAction:"external_url",ctaUrl:""},"ctaUrl"],
    [{registrationOpensDate:"08/01/26",registrationOpensTime:""},"registrationOpensTime"],
    [{imageAlt:""},"imageAlt"],
  ];
  for(const [change,field] of cases)assert.throws(
    ()=>validateForPublish({...complete,...change},0),
    (error:unknown)=>Boolean(error&&typeof error==="object"&&"fieldErrors" in error&&(error as {fieldErrors?:Record<string,string>}).fieldErrors?.[field]),
    field,
  );
  const completedLater={...complete,eventDate:"08/"};
  completedLater.eventDate="09/27/26";
  assert.doesNotThrow(()=>validateForPublish(completedLater,0));
});
test("calendar date and writable time parsing rejects invalid input", () => {
  assert.throws(() =>
    parseDate("02/30/26", "eventDate"),
  );

  assert.doesNotThrow(() =>
    parseDate("02/20/26", "eventDate"),
  );

  assert.throws(() => parseDate("2026-02-20", "eventDate"));
  assert.doesNotThrow(() => parseDate("02/29/28", "eventDate"));
  assert.throws(() => parseDate("02/29/27", "eventDate"));

  assert.throws(() =>
    parseTime("25:00", "startTime"),
  );

  assert.equal(
    parseTime("9:30 PM", "startTime").hour,
    21,
  );
});
test("Boise conversion observes daylight saving boundaries",()=>{const winter=zonedInstant(parseDate("01/15/26","eventDate"),{hour:12,minute:0});const summer=zonedInstant(parseDate("07/15/26","eventDate"),{hour:12,minute:0});assert.equal(new Date(winter).toISOString(),"2026-01-15T19:00:00.000Z");assert.equal(new Date(summer).toISOString(),"2026-07-15T18:00:00.000Z");assert.throws(()=>zonedInstant(parseDate("03/08/26","eventDate"),{hour:2,minute:30}));});
test("all-day convention is local midnight through next local midnight", () => {
  const t = materializeTimes({
    ...complete,
    eventDate: "03/08/26",
    allDay: true,
    startTime: "",
    endTime: "",
    registrationOpensDate: "",
    registrationOpensTime: "",
    registrationClosesDate: "",
    registrationClosesTime: "",
  });

  assert.equal(
    t.endsAt - t.startsAt,
    23 * 60 * 60 * 1000,
  );
});
test("saved timed values normalize in Boise and retain their display fields",()=>{const event={...complete,startTime:"6:05 pm",endTime:"8:30 pm"};const times=materializeTimes(event);assert.equal(new Date(times.startsAt).toISOString(),"2026-09-28T00:05:00.000Z");assert.equal(new Date(times.endsAt).toISOString(),"2026-09-28T02:30:00.000Z");assert.equal(event.startTime,"6:05 PM");assert.equal(event.endTime,"8:30 PM");});
test("admin and public cards can share timed and all-day labels",()=>{assert.equal(formatEventSchedule(complete),"September 27, 2026 · 6:00 PM–8:00 PM");assert.equal(formatEventSchedule({...complete,allDay:true}),"September 27, 2026 · All day");});

test("event schedule formatting tolerates progressive and impossible dates", () => {
  for (const eventDate of ["", "0", "08", "08/", "08/1", "08/15", "02/31/26"]) {
    assert.equal(formatEventSchedule({ eventDate }), "Date not set");
    assert.equal(isValidEventDate(eventDate), false);
  }

  assert.equal(formatEventSchedule({ eventDate: "08/15/26" }), "August 15, 2026");
  assert.equal(isValidEventDate("08/15/26"), true);
  assert.equal(isValidEventDate("02/29/27"), false);
  assert.equal(isValidEventDate("02/29/28"), true);
});

test("typed and picked event dates synchronize only when complete and valid", () => {
  for (const partial of ["0", "08", "08/", "08/1", "08/15", "02/30/26"]) {
    assert.equal(eventDateToPickerValue(partial), null);
  }
  assert.equal(eventDateToPickerValue("08/15/26"), "2026-08-15");
  assert.equal(pickerValueToEventDate("2026-08-15"), "08/15/26");
  assert.equal(eventDateToPickerValue("02/29/28"), "2028-02-29");
  assert.equal(pickerValueToEventDate("2028-02-29"), "02/29/28");
  assert.equal(pickerValueToEventDate("2027-02-29"), null);
});

test("event schedule formatting tolerates missing and partial times", () => {
  const eventDate = "08/15/26";
  assert.equal(formatEventSchedule({ eventDate, startTime: "", endTime: "" }), "August 15, 2026");
  assert.equal(formatEventSchedule({ eventDate, startTime: "6", endTime: "" }), "August 15, 2026 · 6");
  assert.equal(formatEventSchedule({ eventDate, startTime: "6:0", endTime: "8:" }), "August 15, 2026 · 6:0–8:");
  assert.equal(formatEventSchedule({ eventDate, startTime: "", endTime: "8:30 PM" }), "August 15, 2026");
});

test("event schedule formatting safely follows all-day state changes", () => {
  const form = { eventDate: "08/15/26", startTime: "6:00 PM", endTime: "8:30 PM", allDay: false };
  assert.equal(formatEventSchedule(form), "August 15, 2026 · 6:00 PM–8:30 PM");
  assert.equal(formatEventSchedule({ ...form, allDay: true }), "August 15, 2026 · All day");
  assert.equal(formatEventSchedule({ ...form, eventDate: "08/", allDay: true }), "Date not set · All day");
});
test("attendance, appointment, guest, cost, CTA, and custom-label dependencies",()=>{assert.throws(()=>parseEvent({...complete,attendanceType:"appointment_required",appointmentRequired:false,ctaAction:"appointment"}));assert.throws(()=>parseEvent({...complete,maxGuests:21}));assert.throws(()=>parseEvent({...complete,eventLabel:"Custom",customLabel:""}));assert.throws(()=>parseEvent({...complete,ctaAction:"external_url",ctaUrl:"javascript:bad"}));assert.throws(()=>parseEvent({...complete,attendanceType:"information_only",ctaAction:"registration"}));assert.equal(parseEvent({...complete,costType:"custom",costLabel:"Purchase required"}).costLabel,"Purchase required");});
test("progressive cost types use semantic defaults and require paid or custom wording",()=>{
  assert.equal(parseEvent({...complete,costType:"complimentary",costLabel:""}).costLabel,"Complimentary");
  assert.equal(parseEvent({...complete,costType:"purchase_required",costLabel:""}).costLabel,"Purchase required");
  assert.equal(parseEvent({...complete,costType:"free_with_rsvp",costLabel:""}).costLabel,"Free with RSVP");
  assert.equal(parseEvent({...complete,costType:"not_applicable",costLabel:""}).costLabel,"Not applicable");
  assert.throws(()=>parseEvent({...complete,costType:"paid",costLabel:""}));
  assert.throws(()=>parseEvent({...complete,costType:"custom",costLabel:""}));
  assert.equal(parseEvent({...complete,costType:"paid",costLabel:"$25 per guest"}).costLabel,"$25 per guest");
});
test("legacy management helpers remain stable",()=>{assert.equal(capacityAvailable(10,8,2),true);assert.equal(canTransitionEvent("draft","published"),true);assert.equal(rangesOverlap(1,3,2,4),true);assert.equal(csvCell('a,b'),'"a,b"');});
test("event edits retain RSVP and appointment records",async()=>{const source=await readFile(new URL("../app/api/admin/events/[eventId]/route.ts",import.meta.url),"utf8");assert.doesNotMatch(source,/DELETE FROM event_(rsvps|appointment_slots)/);assert.match(source,/UPDATE events SET/);});

test("only current event and attendance values may be published while legacy drafts are preserved", async () => {
  const management = await import("../lib/server/event-management");
  assert.deepEqual([...management.eventLabels], ["Open House", "Workshop", "Community Event", "Presell", "Special Event", "Custom"]);
  assert.deepEqual([...management.attendanceTypes], ["open_attendance", "appointment_required", "appointment_recommended", "general_rsvp", "information_only"]);
  assert.equal(parseEventDraft({ eventLabel: "Styling Event" }).eventLabel, "Styling Event");
  assert.equal(parseEventDraft({ attendanceType: "invitation_only" }).attendanceType, "invitation_only");
  assert.throws(
    () => validateForPublish({ ...complete, eventLabel: "Styling Event" }, 0),
    (error: unknown) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "fieldErrors" in error &&
          (error as { fieldErrors?: Record<string, string> }).fieldErrors?.eventLabel,
      ),
  );
  assert.throws(
    () => validateForPublish({ ...complete, attendanceType: "invitation_only" }, 0),
    (error: unknown) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "fieldErrors" in error &&
          (error as { fieldErrors?: Record<string, string> }).fieldErrors?.attendanceType,
      ),
  );
});
