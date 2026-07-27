import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  capacityAvailable,
  canTransitionEvent,
  csvCell,
  materializeTimes,
  parseDate,
  parseEvent,
  parseTime,
  rangesOverlap,
  validateForPublish,
  zonedInstant,
} from "../lib/server/event-management";

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
  eventLabel: "Styling Event",
  customLabel: "",
  shortDescription: "An evening of personal styling.",
  description: "Full details",
  offer: "Gift with purchase",
  offerDetails: "While supplies last",
  offerTerms: "Terms",
  eventDate: "2026-09-27",
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
  registrationOpensDate: "2026-09-01",
  registrationOpensTime: "9:00 AM",
  registrationClosesDate: "2026-09-27",
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
test("drafts may be incomplete",()=>{const draft=parseEvent({title:"Idea"});assert.equal(draft.title,"Idea");assert.equal(draft.eventDate,"");});
test("calendar date and writable time parsing rejects invalid input", () => {
  assert.throws(() =>
    parseDate("2026-02-30", "eventDate"),
  );

  assert.doesNotThrow(() =>
    parseDate("2026-02-20", "eventDate"),
  );

  assert.throws(() =>
    parseTime("25:00", "startTime"),
  );

  assert.equal(
    parseTime("9:30 PM", "startTime").hour,
    21,
  );
});
test("Boise conversion observes daylight saving boundaries",()=>{const winter=zonedInstant(parseDate("2026-01-15","eventDate"),{hour:12,minute:0});const summer=zonedInstant(parseDate("2026-07-15","eventDate"),{hour:12,minute:0});assert.equal(new Date(winter).toISOString(),"2026-01-15T19:00:00.000Z");assert.equal(new Date(summer).toISOString(),"2026-07-15T18:00:00.000Z");assert.throws(()=>zonedInstant(parseDate("2026-03-08","eventDate"),{hour:2,minute:30}));});
test("all-day convention is local midnight through next local midnight", () => {
  const t = materializeTimes({
    ...complete,
    eventDate: "2026-03-08",
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
test("all-day convention is local midnight through next local midnight",()=>{const t=materializeTimes({...complete,eventDate:"2026-03-08",allDay:true,startTime:"",endTime:"",registrationOpensDate:"",registrationOpensTime:"",registrationClosesDate:"",registrationClosesTime:""});assert.equal(t.endsAt-t.startsAt,23*60*60*1000);});
test("attendance, appointment, guest, cost, CTA, and custom-label dependencies",()=>{assert.throws(()=>parseEvent({...complete,attendanceType:"appointment_required",appointmentRequired:false,ctaAction:"appointment"}));assert.throws(()=>parseEvent({...complete,maxGuests:21}));assert.throws(()=>parseEvent({...complete,eventLabel:"Custom",customLabel:""}));assert.throws(()=>parseEvent({...complete,ctaAction:"external_url",ctaUrl:"javascript:bad"}));assert.throws(()=>parseEvent({...complete,attendanceType:"information_only",ctaAction:"registration"}));assert.equal(parseEvent({...complete,costType:"custom",costLabel:"Purchase required"}).costLabel,"Purchase required");});
test("legacy management helpers remain stable",()=>{assert.equal(capacityAvailable(10,8,2),true);assert.equal(canTransitionEvent("draft","published"),true);assert.equal(rangesOverlap(1,3,2,4),true);assert.equal(csvCell('a,b'),'"a,b"');});
test("event edits retain RSVP and appointment records",async()=>{const source=await readFile(new URL("../app/api/admin/events/[eventId]/route.ts",import.meta.url),"utf8");assert.doesNotMatch(source,/DELETE FROM event_(rsvps|appointment_slots)/);assert.match(source,/UPDATE events SET/);});
