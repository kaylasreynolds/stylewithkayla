import { ApiError } from "./http";
import { anonymizedClientEmail } from "./retention-policy";

type CandidateRow = {
  id: string;
  fullName: string;
  email: string;
  retentionDeleteAfter: number;
};

type RequestRow = {
  id: string;
  clientId: string;
  kind: string;
  status: string;
};

const eligibleSql = `
  c.retention_delete_after IS NOT NULL
  AND c.retention_delete_after <= ?
  AND NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.client_id = c.id AND b.status IN ('pending','change_proposed','confirmed')
  )
  AND NOT EXISTS (
    SELECT 1 FROM data_requests dr
    WHERE dr.client_id = c.id
      AND dr.kind IN ('access','correction')
      AND dr.status IN ('open','in_progress')
  )`;

export async function maintenanceSummary(db: D1Database, now = Date.now()) {
  const [expired, due, open] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS count FROM private_access_tokens WHERE revoked_at IS NULL AND expires_at <= ?`).bind(now).first<{count:number}>(),
    db.prepare(`SELECT COUNT(*) AS count FROM clients c WHERE ${eligibleSql}`).bind(now).first<{count:number}>(),
    db.prepare(`SELECT COUNT(*) AS count FROM data_requests WHERE status IN ('open','in_progress')`).first<{count:number}>(),
  ]);
  return { expiredTokenCount: expired?.count ?? 0, dueClientCount: due?.count ?? 0, openDataRequestCount: open?.count ?? 0 };
}

async function eraseClientData(db: D1Database, clientId: string, now: number, auditRequestId: string, resolutionNote: string) {
  const deletedEmail = anonymizedClientEmail(clientId);
  await db.batch([
    db.prepare(`DELETE FROM bookings WHERE client_id=?`).bind(clientId),
    db.prepare(`UPDATE data_requests SET request_details=NULL,resolution_note=CASE WHEN id=? THEN ? ELSE 'Request record retained after written data deletion.' END,status=CASE WHEN id=? THEN 'completed' ELSE status END,completed_at=CASE WHEN id=? THEN ? ELSE completed_at END WHERE client_id=?`).bind(auditRequestId,resolutionNote,auditRequestId,auditRequestId,now,clientId),
    db.prepare(`UPDATE clients SET full_name='Deleted client',email=?,normalized_email=?,phone='Deleted',normalized_phone=NULL,last_completed_appointment_at=NULL,retention_delete_after=NULL,deletion_requested_at=?,updated_at=? WHERE id=?`).bind(deletedEmail,deletedEmail,now,now,clientId),
  ]);
}

export async function runRetentionMaintenance(db: D1Database, now = Date.now(), limit = 100) {
  const revoked = await db.prepare(`UPDATE private_access_tokens SET revoked_at=? WHERE revoked_at IS NULL AND expires_at <= ?`).bind(now,now).run();
  const candidates = (await db.prepare(`SELECT c.id,c.full_name AS fullName,c.email,c.retention_delete_after AS retentionDeleteAfter FROM clients c WHERE ${eligibleSql} ORDER BY c.retention_delete_after LIMIT ?`).bind(now,limit).all<CandidateRow>()).results;
  for (const client of candidates) {
    const requestId = crypto.randomUUID();
    await db.prepare(`INSERT INTO data_requests(id,client_id,kind,status,request_details,resolution_note,created_at,completed_at) VALUES(?,?,'deletion','completed',NULL,?,?,?)`).bind(requestId,client.id,"Automated retention cleanup completed after the approved two-year period.",now,now).run();
    await eraseClientData(db,client.id,now,requestId,"Automated retention cleanup completed after the approved two-year period.");
  }
  return { revokedExpiredTokenCount: revoked.meta.changes ?? 0, deletedClientCount: candidates.length, limitReached: candidates.length === limit };
}

export async function completeDeletionRequest(db: D1Database, requestId: string, resolutionNote: string, now = Date.now()) {
  const request = await db.prepare(`SELECT id,client_id AS clientId,kind,status FROM data_requests WHERE id=?`).bind(requestId).first<RequestRow>();
  if (!request) throw new ApiError(404,"DATA_REQUEST_NOT_FOUND","Privacy request not found.");
  if (request.kind !== "deletion") throw new ApiError(409,"NOT_A_DELETION_REQUEST","Only deletion requests can erase client data.");
  if (!new Set(["open","in_progress"]).has(request.status)) throw new ApiError(409,"DATA_REQUEST_STATE_CHANGED","This request has already been resolved.");
  const active = await db.prepare(`SELECT COUNT(*) AS count FROM bookings WHERE client_id=? AND status IN ('pending','change_proposed','confirmed')`).bind(request.clientId).first<{count:number}>();
  if ((active?.count ?? 0) > 0) throw new ApiError(409,"ACTIVE_BOOKING_PREVENTS_DELETION","Decline or cancel active appointments before deleting this client’s written data.");
  await eraseClientData(db,request.clientId,now,requestId,resolutionNote);
  return { requestId, completedAt: new Date(now).toISOString(), clientDataDeleted: true };
}

