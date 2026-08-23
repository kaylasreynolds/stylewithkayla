import { requireAdmin } from "@/lib/server/admin-auth";
import { hashPrivateToken, randomPrivateToken } from "@/lib/server/crypto";
import { loadRecapSummarySource } from "@/lib/server/recap-data";
import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { buildRecapSummaryContent, RECAP_SUMMARY_TOKEN_TTL_MS } from "@/lib/server/recap-policy";
import { getD1 } from "@/lib/server/runtime";

type Params = { params: Promise<{ bookingId: string }> };
export async function POST(request: Request, ctx: Params) { return withApi(async id => {
  requireAdmin(request);
  const { bookingId } = await ctx.params, db = getD1(), source = await loadRecapSummarySource(db, bookingId), status = String(source.recap.status);
  if (status === "published") throw new ApiError(409, "ALREADY_PUBLISHED", "This Style Summary has already been published.");
  if (status !== "draft" && status !== "ready_for_review") throw new ApiError(409, "RECAP_NOT_PUBLISHABLE", "Save the appointment wrap-up before publishing its Style Summary.");
  const content = buildRecapSummaryContent(source.recap, source.insights, source.items, source.formulas, source.priorities, source.client, source.booking, source.service);
  const raw = randomPrivateToken(), hash = await hashPrivateToken(raw), now = Date.now(), expires = now + RECAP_SUMMARY_TOKEN_TTL_MS, summaryId = crypto.randomUUID();
  await db.batch([
    db.prepare(`INSERT INTO recap_summaries(id,recap_id,version,content,sent_at,recipient,created_at) VALUES(?,?,COALESCE((SELECT MAX(version)+1 FROM recap_summaries WHERE recap_id=?),1),?,?,?,?)`).bind(summaryId, source.recap.recapId, source.recap.recapId, JSON.stringify(content), now, source.client.email, now),
    db.prepare(`UPDATE appointment_recaps SET status='published',updated_at=? WHERE id=?`).bind(now, source.recap.recapId),
    db.prepare(`UPDATE private_access_tokens SET revoked_at=? WHERE booking_id=? AND purpose='recap_summary' AND revoked_at IS NULL`).bind(now, bookingId),
    db.prepare(`INSERT INTO private_access_tokens(id,booking_id,recap_summary_id,purpose,token_hash,expires_at,created_at) VALUES(?,?,?,'recap_summary',?,?,?)`).bind(crypto.randomUUID(), bookingId, summaryId, hash, expires, now),
  ]);
  return dataResponse({ status: "published", styleSummaryUrl: `${new URL(request.url).origin}/style-summary/${raw}`, styleSummaryExpiresAt: new Date(expires).toISOString() }, 200, id);
}); }
