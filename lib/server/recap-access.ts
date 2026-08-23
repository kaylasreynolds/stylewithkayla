import { hashPrivateToken } from "./crypto";
import { ApiError } from "./http";

export type RecapSummaryAccess={tokenId:string;recapSummaryId:string;bookingId:string;expiresAt:number};
const hidden=()=>new ApiError(404,"PRIVATE_LINK_NOT_FOUND","This private link is not available.");
export async function findRecapSummaryAccess(db:D1Database,raw:string,now=Date.now(),hashToken=hashPrivateToken){if(raw.length<40||raw.length>100)throw hidden();const hash=await hashToken(raw),row=await db.prepare(`SELECT id AS tokenId,recap_summary_id AS recapSummaryId,booking_id AS bookingId,expires_at AS expiresAt,revoked_at AS revokedAt FROM private_access_tokens WHERE token_hash=? AND purpose='recap_summary' LIMIT 1`).bind(hash).first<RecapSummaryAccess&{revokedAt:number|null}>();if(!row||!row.recapSummaryId)throw hidden();if(row.revokedAt||row.expiresAt<=now)throw new ApiError(410,"PRIVATE_LINK_EXPIRED","This private link has expired. Please contact Kayla for a new link.");return row;}
