import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, dataResponse, readJsonObject, rejectUnexpectedKeys, requiredString, withApi } from "@/lib/server/http";
import { completeDeletionRequest } from "@/lib/server/privacy-operations";
import { getD1 } from "@/lib/server/runtime";
type Params={params:Promise<{requestId:string}>};
const statuses = new Set(["in_progress","completed","declined"]);

export async function PATCH(request:Request,ctx:Params) {
  return withApi(async id => {
    requireAdmin(request,true); const {requestId}=await ctx.params;
    const body=await readJsonObject(request);rejectUnexpectedKeys(body,["status","resolutionNote"]);
    const status=requiredString(body.status,"status",20), note=typeof body.resolutionNote === "string" ? body.resolutionNote.trim() : "";
    if(!statuses.has(status))throw new ApiError(422,"INVALID_DATA_REQUEST_STATUS","Choose in progress, completed, or declined.");
    if((status==="completed"||status==="declined")&&!note)throw new ApiError(422,"RESOLUTION_REQUIRED","Add a resolution note before closing this request.");
    const db=getD1(), current=await db.prepare(`SELECT id,kind,status FROM data_requests WHERE id=?`).bind(requestId).first<{id:string;kind:string;status:string}>();
    if(!current)throw new ApiError(404,"DATA_REQUEST_NOT_FOUND","Privacy request not found.");
    if(!new Set(["open","in_progress"]).has(current.status))throw new ApiError(409,"DATA_REQUEST_STATE_CHANGED","This request has already been resolved.");
    if(status==="completed"&&current.kind==="deletion")return dataResponse(await completeDeletionRequest(db,requestId,note),200,id);
    const now=Date.now(), result=await db.prepare(`UPDATE data_requests SET status=?,resolution_note=?,completed_at=? WHERE id=? AND status IN ('open','in_progress')`).bind(status,note||null,status==="in_progress"?null:now,requestId).run();
    if(!result.meta.changes)throw new ApiError(409,"DATA_REQUEST_STATE_CHANGED","This request changed while you were reviewing it.");
    return dataResponse({requestId,status,completedAt:status==="in_progress"?null:new Date(now).toISOString()},200,id);
  });
}

