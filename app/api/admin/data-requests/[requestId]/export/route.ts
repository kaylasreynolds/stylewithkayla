import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, withApi } from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";
type Params={params:Promise<{requestId:string}>};
const privateHeaders={"Cache-Control":"no-store","Referrer-Policy":"no-referrer"};

export async function GET(request:Request,ctx:Params){
  return withApi(async()=>{
    requireAdmin(request);const{requestId}=await ctx.params,db=getD1();
    const record=await db.prepare(`SELECT dr.id,dr.kind,dr.status,dr.request_details AS requestDetails,dr.created_at AS requestedAt,c.id AS clientId,c.full_name AS fullName,c.email,c.phone,c.created_at AS clientCreatedAt,c.last_completed_appointment_at AS lastCompletedAppointmentAt,c.retention_delete_after AS retentionDeleteAfter FROM data_requests dr JOIN clients c ON c.id=dr.client_id WHERE dr.id=?`).bind(requestId).first<Record<string,unknown>>();
    if(!record)throw new ApiError(404,"DATA_REQUEST_NOT_FOUND","Privacy request not found.");
    const bookings=(await db.prepare(`SELECT b.*,s.code AS service_code,s.name AS service_name FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.client_id=? ORDER BY b.created_at`).bind(record.clientId).all()).results;
    const profiles=(await db.prepare(`SELECT sp.* FROM style_profiles sp WHERE sp.client_id=? ORDER BY sp.created_at`).bind(record.clientId).all()).results;
    const payload={exportedAt:new Date().toISOString(),request:{id:record.id,kind:record.kind,status:record.status,requestDetails:record.requestDetails,requestedAt:new Date(record.requestedAt as number).toISOString()},client:{id:record.clientId,fullName:record.fullName,email:record.email,phone:record.phone,createdAt:new Date(record.clientCreatedAt as number).toISOString(),lastCompletedAppointmentAt:record.lastCompletedAppointmentAt?new Date(record.lastCompletedAppointmentAt as number).toISOString():null,retentionDeleteAfter:record.retentionDeleteAfter?new Date(record.retentionDeleteAfter as number).toISOString():null},bookings,styleProfiles:profiles.map(profile=>({...profile,answers:typeof profile.answers==="string"?JSON.parse(profile.answers):profile.answers}))};
    return new Response(JSON.stringify(payload,null,2),{headers:{...privateHeaders,"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="style-with-kayla-data-request-${requestId}.json"`}});
  });
}

