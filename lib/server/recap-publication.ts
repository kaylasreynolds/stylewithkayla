import { encryptPrivateToken, hashPrivateToken, randomPrivateToken, type EncryptedPrivateToken } from "./crypto";
import { ApiError } from "./http";
import type { RecapSummaryContent } from "./recap-policy";

type PublicationInput = {
  db: D1Database;
  bookingId: string;
  recapId: string;
  content: RecapSummaryContent;
  origin: string;
  encryptionKey: string;
};

type PublicationDependencies = {
  now?: () => number;
  id?: () => string;
  rawToken?: () => string;
  hashToken?: (raw: string) => Promise<string>;
  encryptToken?: (raw: string) => Promise<EncryptedPrivateToken>;
};

/** Atomically freezes a recap and issues its private link. Conditional statements make a losing concurrent caller write nothing. */
export async function publishRecapSummary(input: PublicationInput, dependencies: PublicationDependencies = {}) {
  const now = (dependencies.now ?? Date.now)(), id = dependencies.id ?? (() => crypto.randomUUID()), raw = (dependencies.rawToken ?? randomPrivateToken)();
  const hash = await (dependencies.hashToken ?? hashPrivateToken)(raw), encrypted = await (dependencies.encryptToken ?? (value => encryptPrivateToken(value, input.encryptionKey)))(raw), summaryId = id();
  const results = await input.db.batch([
    input.db.prepare(`INSERT INTO recap_summaries(id,recap_id,version,content,sent_at,recipient,created_at) SELECT ?,r.id,COALESCE((SELECT MAX(version)+1 FROM recap_summaries WHERE recap_id=r.id),1),?,NULL,NULL,? FROM appointment_recaps r WHERE r.id=? AND r.status IN ('draft','ready_for_review')`).bind(summaryId, JSON.stringify(input.content), now, input.recapId),
    input.db.prepare(`UPDATE appointment_recaps SET status='published',updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM recap_summaries WHERE id=?)`).bind(now, input.recapId, summaryId),
    input.db.prepare(`INSERT INTO private_access_tokens(id,booking_id,recap_summary_id,purpose,token_hash,expires_at,token_ciphertext,token_iv,token_auth_tag,created_at) SELECT ?,?,?, 'recap_summary',?,NULL,?,?,?,? WHERE EXISTS(SELECT 1 FROM recap_summaries WHERE id=?)`).bind(id(), input.bookingId, summaryId, hash, encrypted.tokenCiphertext, encrypted.tokenIv, encrypted.tokenAuthTag, now, summaryId),
  ]);
  if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new ApiError(409, "ALREADY_PUBLISHED", "This Style Summary has already been published.");
  return { status: "published" as const, styleSummaryUrl: `${input.origin}/style-summary/${raw}` };
}
