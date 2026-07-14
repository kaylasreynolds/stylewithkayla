import { hashPrivateToken } from "./crypto";
import { ApiError } from "./http";
import { getD1 } from "./runtime";

export type ProfileAccess={tokenId:string;profileId:string;bookingId:string;expiresAt:number};
export async function requireProfileAccess(raw:string){if(raw.length<40||raw.length>100)throw hidden();const hash=await hashPrivateToken(raw),db=getD1(),row=await db.prepare(`SELECT t.id AS tokenId,t.profile_id AS profileId,t.booking_id AS bookingId,t.expires_at AS expiresAt,t.revoked_at AS revokedAt FROM private_access_tokens t WHERE t.token_hash=? AND t.purpose='style_profile' LIMIT 1`).bind(hash).first<ProfileAccess&{revokedAt:number|null}>();if(!row)throw hidden();if(row.revokedAt||row.expiresAt<=Date.now())throw new ApiError(410,"PRIVATE_LINK_EXPIRED","This private link has expired. Please contact Kayla for a new link.");return row;}
function hidden(){return new ApiError(404,"PRIVATE_LINK_NOT_FOUND","This private link is not available.");}
