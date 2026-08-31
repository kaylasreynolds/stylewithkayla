import { requireAdmin } from "@/lib/server/admin-auth";
import { loadRecapSummarySource } from "@/lib/server/recap-data";
import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { buildRecapSummaryContent } from "@/lib/server/recap-policy";
import { publishRecapSummary } from "@/lib/server/recap-publication";
import { getD1, getStyleSummaryTokenEncryptionKey } from "@/lib/server/runtime";

type Params = { params: Promise<{ bookingId: string }> };
export async function POST(request: Request, ctx: Params) { return withApi(async id => {
  requireAdmin(request);
  const { bookingId } = await ctx.params, db = getD1(), source = await loadRecapSummarySource(db, bookingId), status = String(source.recap.status);
  if (status === "published") throw new ApiError(409, "ALREADY_PUBLISHED", "This Style Summary has already been published.");
  if (status !== "draft" && status !== "ready_for_review") throw new ApiError(409, "RECAP_NOT_PUBLISHABLE", "Save the appointment wrap-up before publishing its Style Summary.");
  const content = buildRecapSummaryContent(source.recap, source.insights, source.items, source.formulas, source.priorities, source.client, source.booking, source.service);
  return dataResponse(await publishRecapSummary({ db, bookingId, recapId: String(source.recap.recapId), content, origin: new URL(request.url).origin, encryptionKey:getStyleSummaryTokenEncryptionKey() }), 200, id);
}); }
