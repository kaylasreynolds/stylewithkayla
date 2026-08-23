import { hashPrivateToken, randomPrivateToken } from "./crypto";
import { ApiError } from "./http";
import type { RecapSummaryContent } from "./recap-policy";
import { RECAP_SUMMARY_TOKEN_TTL_MS } from "./recap-policy";

type PublicationInput = {
  db: D1Database;
  bookingId: string;
  recapId: string;
  recipient: string | null;
  content: RecapSummaryContent;
  origin: string;
};

type PublicationDependencies = {
  now?: () => number;
  id?: () => string;
  rawToken?: () => string;
  hashToken?: (raw: string) => Promise<string>;
};

/** Atomically freezes a recap and issues its private link. Conditional statements make a losing concurrent caller write nothing. */
export async function publishRecapSummary(input: PublicationInput, dependencies: PublicationDependencies = {}) {
  const now = (dependencies.now ?? Date.now)(), id = dependencies.id ?? (() => crypto.randomUUID()), raw = (dependencies.rawToken ?? randomPrivateToken)();
  const hash = await (dependencies.hashToken ?? hashPrivateToken)(raw), expires = now + RECAP_SUMMARY_TOKEN_TTL_MS, summaryId = id();
  const results = await input.db.batch([
    input.db.prepare(`INSERT INTO recap_summaries(id,recap_id,version,content,sent_at,recipient,created_at) SELECT ?,r.id,COALESCE((SELECT MAX(version)+1 FROM recap_summaries WHERE recap_id=r.id),1),?,?,?,? FROM appointment_recaps r WHERE r.id=? AND r.status IN ('draft','ready_for_review')`).bind(summaryId, JSON.stringify(input.content), now, input.recipient, now, input.recapId),
    input.db.prepare(`UPDATE appointment_recaps SET status='published',updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM recap_summaries WHERE id=?)`).bind(now, input.recapId, summaryId),
    input.db.prepare(`UPDATE private_access_tokens SET revoked_at=? WHERE booking_id=? AND purpose='recap_summary' AND revoked_at IS NULL AND EXISTS(SELECT 1 FROM recap_summaries WHERE id=?)`).bind(now, input.bookingId, summaryId),
    input.db.prepare(`INSERT INTO private_access_tokens(id,booking_id,recap_summary_id,purpose,token_hash,expires_at,created_at) SELECT ?,?,?, 'recap_summary',?,?,? WHERE EXISTS(SELECT 1 FROM recap_summaries WHERE id=?)`).bind(id(), input.bookingId, summaryId, hash, expires, now, summaryId),
  ]);
  if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new ApiError(409, "ALREADY_PUBLISHED", "This Style Summary has already been published.");
  return { status: "published" as const, styleSummaryUrl: `${input.origin}/style-summary/${raw}`, styleSummaryExpiresAt: new Date(expires).toISOString() };
}
