import { ApiError, optionalString, rejectUnexpectedKeys, requiredString, validation } from "./http";
import { instant, publicEventJson } from "./event-management-core";

export const eventStatuses = ["draft", "published", "archived"] as const;
export const rsvpStatuses = ["confirmed", "waitlisted", "cancelled", "declined"] as const;
export const eventLabels = ["Appointment","RSVP","Drop-In","Open House","Workshop","Styling Event","Brand Event","Community Event","Limited Spots","Presell","Special Event","Custom"] as const;
export const attendanceTypes = ["appointment_required","appointment_recommended","general_rsvp","drop_in","open_attendance","invitation_only","interest_list","information_only"] as const;
export const costTypes = ["complimentary","paid","custom"] as const;
export const ctaActions = ["registration","appointment","interest_list","external_url","email","phone","information","add_to_calendar","none"] as const;
export const EVENT_KEYS = ["title","eventLabel","customLabel","shortDescription","description","offer","offerDetails","offerTerms","eventDate","startTime","endTime","allDay","timezone","location","locationDetails","directionsUrl","attendanceType","capacity","unlimitedCapacity","maxGuests","allowGuestNames","registrationOpensDate","registrationOpensTime","registrationClosesDate","registrationClosesTime","allowDuplicateRegistration","appointmentRequired","appointmentRecommended","costType","costLabel","ctaLabel","ctaAction","ctaUrl","ctaEmail","ctaPhone","sharingEnabled","shareMessage","imageAssetId","imageAlt"] as const;
export type EventInput = Record<string, unknown>;

export function enumValue<T extends string>(value: unknown, field: string, values: readonly T[]): T { if(typeof value!=="string"||!values.includes(value as T))throw validation(field,`Choose one of: ${values.join(", ")}.`);return value as T; }
export function positiveInteger(value: unknown, field: string, max=100000){if(!Number.isInteger(value)||(value as number)<1||(value as number)>max)throw validation(field,`Enter a whole number from 1 to ${max}.`);return value as number;}
const bool=(v:unknown,field:string)=>{if(typeof v!=="boolean")throw validation(field,"Choose yes or no.");return v;};
const timePattern=/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDate(value: unknown, field: string) {
  const s = requiredString(value, field, 10);
  const match = s.match(datePattern);

  if (!match) {
    throw validation(
      field,
      "Choose a valid calendar date.",
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw validation(
      field,
      "Choose a real calendar date.",
    );
  }

  return {
    text: s,
    year,
    month,
    day,
  };
}
export function parseTime(value:unknown,field:string){const s=requiredString(value,field,8),m=s.match(timePattern);if(!m)throw validation(field,"Use a time such as 09:30 AM.");let hour=Number(m[1])%12;if(m[3].toUpperCase()==="PM")hour+=12;return {text:s.toUpperCase(),hour,minute:Number(m[2])};}
function zoneParts(ms:number,zone:string){const parts=new Intl.DateTimeFormat("en-US",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(ms);return Object.fromEntries(parts.map(p=>[p.type,Number(p.value)]));}
/** Converts an explicitly-entered Boise wall time without consulting the browser/host zone. */
export function zonedInstant(date:ReturnType<typeof parseDate>,time:{hour:number;minute:number},zone="America/Boise",field="eventDate"){
  if(zone!=="America/Boise")throw validation("timezone","America/Boise is currently the supported event time zone.");
  const desired=Date.UTC(date.year,date.month-1,date.day,time.hour,time.minute);let guess=desired;
  for(let i=0;i<3;i++){const p=zoneParts(guess,zone);const represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute);guess+=desired-represented;}
  const p=zoneParts(guess,zone);if(p.year!==date.year||p.month!==date.month||p.day!==date.day||p.hour!==time.hour||p.minute!==time.minute)throw validation(field,"That local time does not exist because of daylight saving time.");return guess;
}
const str=(v:unknown,f:string,n:number)=>optionalString(v,f,n)??"";
const email=(v:unknown,f:string)=>{const s=str(v,f,254);if(s&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw validation(f,"Enter a valid email address.");return s;};
const url=(v:unknown,f:string)=>{const s=str(v,f,2048);if(s){try{const u=new URL(s);if(!["http:","https:"].includes(u.protocol))throw 0;}catch{throw validation(f,"Enter a complete http:// or https:// URL.");}}return s;};
export function parseEvent(value:Record<string,unknown>,partial=false,draft=false){rejectUnexpectedKeys(value,EVENT_KEYS);const o:EventInput={};const take=(k:string,fn:(v:unknown)=>unknown,def?:unknown)=>{if(k in value)o[k]=fn(value[k]);else if(!partial&&def!==undefined)o[k]=def;};
  take("title",v=>str(v,"title",160),"");take("eventLabel",v=>v===""?"":enumValue(v,"eventLabel",eventLabels),"");take("customLabel",v=>str(v,"customLabel",80),"");take("shortDescription",v=>str(v,"shortDescription",320),"");take("description",v=>str(v,"description",5000),"");take("offer",v=>str(v,"offer",180),"");take("offerDetails",v=>str(v,"offerDetails",1000),"");take("offerTerms",v=>str(v,"offerTerms",1000),"");
  take("eventDate",v=>str(v,"eventDate",10),"");take("startTime",v=>str(v,"startTime",8),"");take("endTime",v=>str(v,"endTime",8),"");take("allDay",v=>bool(v,"allDay"),false);take("timezone",v=>requiredString(v,"timezone",64),"America/Boise");take("location",v=>str(v,"location",300),"");take("locationDetails",v=>str(v,"locationDetails",500),"");take("directionsUrl",v=>url(v,"directionsUrl"),"");
  take("attendanceType",v=>v===""?"":enumValue(v,"attendanceType",attendanceTypes),"");take("capacity",v=>v===null||v===""?null:positiveInteger(v,"capacity",10000),null);take("unlimitedCapacity",v=>bool(v,"unlimitedCapacity"),false);take("maxGuests",v=>Number.isInteger(v)&&(v as number)>=0&&(v as number)<=20?v:(()=>{throw validation("maxGuests","Enter a whole number from 0 to 20.")})(),0);take("allowGuestNames",v=>bool(v,"allowGuestNames"),false);
  for(const k of ["registrationOpensDate","registrationOpensTime","registrationClosesDate","registrationClosesTime"] as const)take(k,v=>str(v,k,10),"");take("allowDuplicateRegistration",v=>bool(v,"allowDuplicateRegistration"),false);take("appointmentRequired",v=>bool(v,"appointmentRequired"),false);take("appointmentRecommended",v=>bool(v,"appointmentRecommended"),false);
  take("costType",v=>v===""?"":enumValue(v,"costType",costTypes),"");take("costLabel",v=>str(v,"costLabel",120),"");take("ctaLabel",v=>str(v,"ctaLabel",100),"");take("ctaAction",v=>v===""?"":enumValue(v,"ctaAction",ctaActions),"");take("ctaUrl",v=>url(v,"ctaUrl"),"");take("ctaEmail",v=>email(v,"ctaEmail"),"");take("ctaPhone",v=>{const s=str(v,"ctaPhone",40);if(s&&!/^\+?[0-9() .-]{7,40}$/.test(s))throw validation("ctaPhone","Enter a valid phone number.");return s;},"");take("sharingEnabled",v=>bool(v,"sharingEnabled"),true);take("shareMessage",v=>str(v,"shareMessage",1500),"");take("imageAssetId",v=>v===null||v===""?null:requiredString(v,"imageAssetId",100),null);take("imageAlt",v=>str(v,"imageAlt",240),"");
  if(!draft)validateDependencies(o,partial);return o;
}
function validateDependencies(o: EventInput, partial: boolean) {
  if (partial) return;

  const attendanceType = o.attendanceType;

  if (
    attendanceType === "appointment_required" &&
    !o.appointmentRequired
  ) {
    throw validation(
      "appointmentRequired",
      "Appointment-required events must require a slot.",
    );
  }

  if (
    attendanceType !== "appointment_required" &&
    o.appointmentRequired
  ) {
    throw validation(
      "appointmentRequired",
      "This attendance type cannot require an appointment.",
    );
  }

  if (
    attendanceType === "appointment_recommended" &&
    !o.appointmentRecommended
  ) {
    throw validation(
      "appointmentRecommended",
      "Appointment-recommended events must enable this setting.",
    );
  }

  if (o.appointmentRequired && o.appointmentRecommended) {
    throw validation(
      "appointmentRecommended",
      "Choose required or recommended, not both.",
    );
  }

  if (o.unlimitedCapacity) {
    o.capacity = null;
  } else if (
    attendanceType &&
    ![
      "information_only",
      "open_attendance",
      "drop_in",
    ].includes(String(attendanceType)) &&
    !o.capacity
  ) {
    throw validation(
      "capacity",
      "Enter capacity or select unlimited.",
    );
  }

  if (o.eventLabel === "Custom" && !o.customLabel) {
    throw validation(
      "customLabel",
      "Enter the custom event label.",
    );
  }

  const action = o.ctaAction;

  if (action === "external_url" && !o.ctaUrl) {
    throw validation(
      "ctaUrl",
      "Enter the CTA destination URL.",
    );
  }

  if (action === "email" && !o.ctaEmail) {
    throw validation(
      "ctaEmail",
      "Enter the CTA email address.",
    );
  }

  if (action === "phone" && !o.ctaPhone) {
    throw validation(
      "ctaPhone",
      "Enter the CTA phone number.",
    );
  }

  const allowed: Record<string, string[]> = {
    appointment_required: [
      "appointment",
      "add_to_calendar",
    ],

    appointment_recommended: [
      "appointment",
      "registration",
      "information",
      "external_url",
      "email",
      "phone",
      "add_to_calendar",
      "none",
    ],

    general_rsvp: [
      "registration",
      "add_to_calendar",
    ],

    interest_list: [
      "interest_list",
      "add_to_calendar",
    ],

    information_only: [
      "information",
      "external_url",
      "email",
      "phone",
      "add_to_calendar",
      "none",
    ],

    invitation_only: [
      "information",
      "email",
      "phone",
      "add_to_calendar",
      "none",
    ],

    drop_in: [
      "information",
      "external_url",
      "add_to_calendar",
      "none",
    ],

    open_attendance: [
      "information",
      "external_url",
      "add_to_calendar",
      "none",
    ],
  };

  if (
    attendanceType &&
    action &&
    allowed[String(attendanceType)] &&
    !allowed[String(attendanceType)].includes(String(action))
  ) {
    throw validation(
      "ctaAction",
      "This CTA action conflicts with the attendance type.",
    );
  }
}export function materializeTimes(o:EventInput){if(!o.eventDate)return {startsAt:0,endsAt:1,registrationOpensAt:null,registrationClosesAt:null};const d=parseDate(o.eventDate,"eventDate"),zone=String(o.timezone||"America/Boise");if(!o.allDay&&(!o.startTime||!o.endTime))return {startsAt:0,endsAt:1,registrationOpensAt:null,registrationClosesAt:null};let startsAt:number,endsAt:number;if(o.allDay){startsAt=zonedInstant(d,{hour:0,minute:0},zone);const next=new Date(Date.UTC(d.year,d.month-1,d.day+1));endsAt=zonedInstant({text:"",year:next.getUTCFullYear(),month:next.getUTCMonth()+1,day:next.getUTCDate()},{hour:0,minute:0},zone);}else{startsAt=zonedInstant(d,parseTime(o.startTime,"startTime"),zone,"startTime");endsAt=zonedInstant(d,parseTime(o.endTime,"endTime"),zone,"endTime");if(endsAt<=startsAt)throw validation("endTime","End time must be after start time.");}const window=(prefix:"registrationOpens"|"registrationCloses")=>{const dv=o[`${prefix}Date`],tv=o[`${prefix}Time`];if(!dv&&!tv)return null;if(!dv||!tv)throw validation(`${prefix}${!dv?"Date":"Time"}`,"Enter both a date and time.");return zonedInstant(parseDate(dv,`${prefix}Date`),parseTime(tv,`${prefix}Time`),zone,`${prefix}Time`);};const registrationOpensAt=window("registrationOpens"),registrationClosesAt=window("registrationCloses");if(registrationOpensAt!==null&&registrationClosesAt!==null&&registrationClosesAt<=registrationOpensAt)throw validation("registrationClosesTime","Registration must close after it opens.");if(registrationClosesAt!==null&&registrationClosesAt>startsAt)throw validation("registrationClosesTime","Registration must close no later than the event start.");return {startsAt,endsAt,registrationOpensAt,registrationClosesAt};}
export function validateForPublish(o:EventInput,now=Date.now()){const required:[string,string][]=[["title","Add an event title."],["shortDescription","Add a short card description."],["eventLabel","Choose an event label."],["eventDate","Add a valid event date."],["location","Add a location."],["attendanceType","Choose an attendance type."],["costLabel","Add a cost label."],["imageAssetId","Add an event image."],["imageAlt","Add meaningful image alternative text."]];for(const [k,m] of required)if(!o[k])throw validation(k,m);if(String(o.imageAlt).trim().length<8)throw validation("imageAlt","Use meaningful alternative text of at least 8 characters.");if(!o.allDay&&(!o.startTime||!o.endTime))throw validation(!o.startTime?"startTime":"endTime","Add a valid time or select all day.");if(o.ctaAction!=="none"&&(!o.ctaAction||!o.ctaLabel))throw validation("ctaLabel","Add a CTA label and action.");validateDependencies(o,false);const times=materializeTimes(o);if(times.endsAt<=now)throw validation("eventDate","The event has already ended.");return times;}
export const iso=(v:number|null)=>v==null?null:new Date(v).toISOString();
export function eventJson(row:Record<string,unknown>){const v=(c:string,s:string)=>row[c]??row[s],b=(c:string,s:string,d=false)=>Boolean(v(c,s)??d);return {id:row.id,title:row.title??"",eventLabel:v("eventLabel","category")??"",customLabel:v("customLabel","custom_label")??"",shortDescription:v("shortDescription","short_description")??"",description:row.description??"",offer:row.offer??"",offerDetails:v("offerDetails","offer_details")??"",offerTerms:v("offerTerms","offer_terms")??"",eventDate:v("eventDate","event_date")??"",startTime:v("startTime","start_time")??"",endTime:v("endTime","end_time")??"",allDay:b("allDay","all_day"),timezone:row.timezone??"America/Boise",location:row.location??"",locationDetails:v("locationDetails","location_details")??"",directionsUrl:v("directionsUrl","directions_url")??"",attendanceType:v("attendanceType","attendance_type")??"",capacity:row.capacity??null,unlimitedCapacity:b("unlimitedCapacity","unlimited_capacity"),maxGuests:v("maxGuests","max_guests")??0,allowGuestNames:b("allowGuestNames","allow_guest_names"),registrationOpensDate:v("registrationOpensDate","registration_opens_date")??"",registrationOpensTime:v("registrationOpensTime","registration_opens_time")??"",registrationClosesDate:v("registrationClosesDate","registration_closes_date")??"",registrationClosesTime:v("registrationClosesTime","registration_closes_time")??"",allowDuplicateRegistration:b("allowDuplicateRegistration","allow_duplicate_registration"),appointmentRequired:b("appointmentRequired","appointment_required"),appointmentRecommended:b("appointmentRecommended","appointment_recommended"),costType:v("costType","cost_type")??"",costLabel:v("costLabel","cost_label")??"",ctaLabel:v("ctaLabel","cta_label")??"",ctaAction:v("ctaAction","cta_action")??"",ctaUrl:v("ctaUrl","cta_url")??"",ctaEmail:v("ctaEmail","cta_email")??"",ctaPhone:v("ctaPhone","cta_phone")??"",sharingEnabled:b("sharingEnabled","sharing_enabled",true),shareMessage:v("shareMessage","share_message")??"",status:row.status,startsAt:iso(Number(v("startsAt","starts_at"))),endsAt:iso(Number(v("endsAt","ends_at"))),publishedAt:iso(v("publishedAt","published_at") as number|null),archivedAt:iso(v("archivedAt","archived_at") as number|null),createdAt:iso(v("createdAt","created_at") as number),updatedAt:iso(v("updatedAt","updated_at") as number),imageAssetId:v("imageAssetId","image_asset_id")??null,imageMimeType:v("imageMimeType","image_mime_type")??null,imageSizeBytes:v("imageSizeBytes","image_size_bytes")??null,imageWidth:v("imageWidth","image_width")??null,imageHeight:v("imageHeight","image_height")??null,imageAlt:v("imageAlt","image_alt")??""};}
export function csvCell(value:unknown){const s=String(value??"");return /[",\r\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}export function canTransitionEvent(from:string,to:string){return(from==="draft"&&to==="published")||((from==="draft"||from==="published")&&to==="archived");}export function capacityAvailable(capacity:number,confirmed:number,requested:number){return Number.isInteger(requested)&&requested>0&&confirmed+requested<=capacity;}export function rangesOverlap(aStart:number,aEnd:number,bStart:number,bEnd:number){return aStart<bEnd&&aEnd>bStart;}export{instant,publicEventJson};
