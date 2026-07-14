import { ApiError } from "./http";
export type ServiceRecord = { id: string; code: string; audience: "women"|"men"; name: string; durationMinutes: number; routingMode: "age"|"womens_event"|"mens_styling"|"mens_event" };
type Settings = { timezone: string; minimumNoticeMinutes: number; bookingHorizonDays: number };
type Window = { startsAt: number; endsAt: number }; type Rule = { weekday: number; startMinute: number; endMinute: number }; type Override = Window & { kind: "available"|"unavailable" };
export type AvailabilityResult = { timezone: string; availabilityMode: "routine_only"; slots: Array<{startsAt:string;endsAt:string}> };
export async function getActiveService(db: D1Database, code: string) {
  const row = await db.prepare(`SELECT id,code,audience,name,duration_minutes AS durationMinutes,routing_mode AS routingMode FROM services WHERE code=? AND active=1`).bind(code).first<ServiceRecord>();
  if (!row) throw new ApiError(404,"SERVICE_NOT_FOUND","That styling service is not available."); return row;
}
export async function calculateAvailability(db:D1Database, code:string, from:string, to:string, now=Date.now(), excludeBookingId?:string):Promise<AvailabilityResult> {
  const service=await getActiveService(db,code); const settings=await db.prepare(`SELECT timezone,minimum_notice_minutes AS minimumNoticeMinutes,booking_horizon_days AS bookingHorizonDays FROM booking_settings WHERE id='default'`).first<Settings>(); if(!settings) throw new Error("Booking settings are missing.");
  validDate(from,"from"); validDate(to,"to"); if(from>to) throw new ApiError(422,"INVALID_DATE_RANGE","The end date must be on or after the start date.");
  const horizon=addDays(localDateKey(now,settings.timezone),settings.bookingHorizonDays); if(to>horizon||daysBetween(from,to)>settings.bookingHorizonDays) throw new ApiError(422,"DATE_OUTSIDE_HORIZON","Choose a date within the next 60 days.");
  const rangeStart=zonedLocalToEpoch(from,0,settings.timezone), rangeEnd=zonedLocalToEpoch(addDays(to,1),0,settings.timezone);
  const rules=(await db.prepare(`SELECT weekday,start_minute AS startMinute,end_minute AS endMinute FROM availability_rules WHERE active=1 ORDER BY weekday,start_minute`).all<Rule>()).results;
  const overrides=(await db.prepare(`SELECT kind,starts_at AS startsAt,ends_at AS endsAt FROM availability_overrides WHERE ends_at>? AND starts_at<?`).bind(rangeStart,rangeEnd).all<Override>()).results;
  const sql=excludeBookingId?`SELECT starts_at AS startsAt,ends_at AS endsAt FROM booking_holds WHERE active=1 AND ends_at>? AND starts_at<? AND booking_id<>?`:`SELECT starts_at AS startsAt,ends_at AS endsAt FROM booking_holds WHERE active=1 AND ends_at>? AND starts_at<?`;
  const holds=(await db.prepare(sql).bind(rangeStart,rangeEnd,...(excludeBookingId?[excludeBookingId]:[])).all<Window>()).results;
  const windows:Window[]=[]; for(let date=from;date<=to;date=addDays(date,1)){const weekday=weekdayForDate(date); for(const r of rules.filter(x=>x.weekday===weekday)) windows.push({startsAt:zonedLocalToEpoch(date,r.startMinute,settings.timezone),endsAt:zonedLocalToEpoch(date,r.endMinute,settings.timezone)});}
  windows.push(...overrides.filter(x=>x.kind==="available").map(({startsAt,endsAt})=>({startsAt,endsAt})));
  const unavailable=overrides.filter(x=>x.kind==="unavailable"), min=now+settings.minimumNoticeMinutes*60000, duration=service.durationMinutes*60000, candidates=new Map<number,number>();
  for(const w of windows) for(let start=w.startsAt;start+duration<=w.endsAt;start+=duration){const end=start+duration;if(start<rangeStart||start>=rangeEnd||start<min||unavailable.some(x=>overlaps(start,end,x))||holds.some(x=>overlaps(start,end,x)))continue;candidates.set(start,end);}
  return {timezone:settings.timezone,availabilityMode:"routine_only",slots:Array.from(candidates,([s,e])=>({startsAt:s,endsAt:e})).sort((a,b)=>a.startsAt-b.startsAt).map(x=>({startsAt:new Date(x.startsAt).toISOString(),endsAt:new Date(x.endsAt).toISOString()}))};
}
export function localDateKey(epoch:number,tz:string){const p=zonedParts(epoch,tz);return `${p.year}-${pad(p.month)}-${pad(p.day)}`;}
export function addDays(value:string,n:number){validDate(value,"date");const[y,m,d]=value.split("-").map(Number),x=new Date(Date.UTC(y,m-1,d+n));return `${x.getUTCFullYear()}-${pad(x.getUTCMonth()+1)}-${pad(x.getUTCDate())}`;}
export function zonedLocalToEpoch(date:string,minuteOfDay:number,tz:string){validDate(date,"date");const[y,m,d]=date.split("-").map(Number),h=Math.floor(minuteOfDay/60),min=minuteOfDay%60,desired=Date.UTC(y,m-1,d,h,min);let epoch=desired;for(let i=0;i<4;i++){const p=zonedParts(epoch,tz),represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute),correction=desired-represented;epoch+=correction;if(!correction)break;}return epoch;}
function zonedParts(epoch:number,tz:string){const v:Record<string,number>={};for(const p of new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(epoch))if(p.type!=="literal")v[p.type]=Number(p.value);return v as {year:number;month:number;day:number;hour:number;minute:number};}
function validDate(v:string,field:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))throw new ApiError(422,"INVALID_DATE",`Use YYYY-MM-DD for ${field}.`);const[y,m,d]=v.split("-").map(Number),x=new Date(Date.UTC(y,m-1,d));if(x.getUTCFullYear()!==y||x.getUTCMonth()+1!==m||x.getUTCDate()!==d)throw new ApiError(422,"INVALID_DATE",`Choose a valid ${field} date.`);}
function weekdayForDate(v:string){const[y,m,d]=v.split("-").map(Number);return new Date(Date.UTC(y,m-1,d)).getUTCDay();} function daysBetween(a:string,b:string){const[ay,am,ad]=a.split("-").map(Number),[by,bm,bd]=b.split("-").map(Number);return Math.round((Date.UTC(by,bm-1,bd)-Date.UTC(ay,am-1,ad))/86400000);} function overlaps(s:number,e:number,w:Window){return w.startsAt<e&&w.endsAt>s;} function pad(n:number){return String(n).padStart(2,"0");}
