import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, dataResponse, optionalString, readJsonObject, rejectUnexpectedKeys, requiredString, withApi } from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

const kinds = new Set(["access","correction","deletion"]);
const statuses = new Set(["open","in_progress","completed","declined"]);
type Row = {id:string;kind:string;status:string;requestDetails:string|null;resolutionNote:string|null;requestedAt:number;completedAt:number|null;clientId:string;clientName:string;clientEmail:string;activeBookingCount:number};

export async function GET(request: Request) {
  return withApi(async id => {
    requireAdmin(request);
    const status = new URL(request.url).searchParams.get("status") ?? "active";
    if (status !== "all" && status !== "active" && !statuses.has(status)) throw new ApiError(422,"INVALID_DATA_REQUEST_STATUS","Choose a valid request status.");
    const where = status === "all" ? "1=1" : status === "active" ? "dr.status IN ('open','in_progress')" : "dr.status=?";
    const statement = getD1().prepare(`SELECT dr.id,dr.kind,dr.status,dr.request_details AS requestDetails,dr.resolution_note AS resolutionNote,dr.created_at AS requestedAt,dr.completed_at AS completedAt,c.id AS clientId,c.full_name AS clientName,c.email AS clientEmail,(SELECT COUNT(*) FROM bookings b WHERE b.client_id=c.id AND b.status IN ('pending','change_proposed','confirmed')) AS activeBookingCount FROM data_requests dr JOIN clients c ON c.id=dr.client_id WHERE ${where} ORDER BY CASE dr.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,dr.created_at ASC LIMIT 100`);
    const rows = (status === "all" || status === "active" ? await statement.all<Row>() : await statement.bind(status).all<Row>()).results;
    return dataResponse({requests:rows.map(row=>({...row,requestedAt:new Date(row.requestedAt).toISOString(),completedAt:row.completedAt?new Date(row.completedAt).toISOString():null}))},200,id);
  });
}

export async function POST(request: Request) {
  return withApi(async id => {
    requireAdmin(request,true);
    const body = await readJsonObject(request); rejectUnexpectedKeys(body,["clientEmail","kind","requestDetails"]);
    const email = requiredString(body.clientEmail,"clientEmail",254).toLowerCase(), kind = requiredString(body.kind,"kind",20), details = optionalString(body.requestDetails,"requestDetails",2000);
    if (!kinds.has(kind)) throw new ApiError(422,"INVALID_DATA_REQUEST_KIND","Choose access, correction, or deletion.");
    const db = getD1(), client = await db.prepare(`SELECT id,full_name AS fullName,email FROM clients WHERE normalized_email=?`).bind(email).first<{id:string;fullName:string;email:string}>();
    if (!client) throw new ApiError(404,"CLIENT_NOT_FOUND","No client record matches that email address.");
    const requestId = crypto.randomUUID(), now = Date.now();
    await db.batch([
      db.prepare(`INSERT INTO data_requests(id,client_id,kind,status,request_details,created_at) VALUES(?,? ,?,'open',?,?)`).bind(requestId,client.id,kind,details,now),
      ...(kind === "deletion" ? [db.prepare(`UPDATE clients SET deletion_requested_at=?,updated_at=? WHERE id=?`).bind(now,now,client.id)] : []),
    ]);
    return dataResponse({request:{id:requestId,kind,status:"open",requestedAt:new Date(now).toISOString(),clientName:client.fullName,clientEmail:client.email}},201,id);
  });
}

