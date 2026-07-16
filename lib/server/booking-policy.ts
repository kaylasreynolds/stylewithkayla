import { ApiError } from "./http";

export type AdminBookingAction="confirm"|"decline"|"release-hold"|"propose-time"|"cancel"|"complete";
const allowed:Record<AdminBookingAction,ReadonlySet<string>>={
  confirm:new Set(["pending","change_proposed"]),decline:new Set(["pending","change_proposed"]),"release-hold":new Set(["pending","change_proposed"]),"propose-time":new Set(["pending","change_proposed"]),cancel:new Set(["confirmed"]),complete:new Set(["confirmed"])
};
export function assertAdminActionState(action:AdminBookingAction,status:string){if(!allowed[action].has(status))throw new ApiError(409,"INVALID_BOOKING_STATE",`The ${action.replace("-"," ")} action is not available for a ${status.replace("_"," ")} booking.`);}
export function addCalendarYears(epoch:number,years:number){const date=new Date(epoch),month=date.getUTCMonth();date.setUTCFullYear(date.getUTCFullYear()+years);if(date.getUTCMonth()!==month)date.setUTCDate(0);return date.getTime();}
