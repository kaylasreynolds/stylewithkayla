import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { requireRecapSummaryAccess } from "@/lib/server/profile-access";
import { getD1 } from "@/lib/server/runtime";
import type { RecapSummaryContent } from "@/lib/server/recap-policy";

type Params = { params: Promise<{ token: string }> };
export async function GET(_request: Request, ctx: Params) { return withApi(async id => { const { token } = await ctx.params, access = await requireRecapSummaryAccess(token); const row = await getD1().prepare(`SELECT content FROM recap_summaries WHERE id=?`).bind(access.recapSummaryId).first<{content:string|RecapSummaryContent}>(); if (!row) throw new ApiError(404, "STYLE_SUMMARY_NOT_FOUND", "This Style Summary is unavailable."); const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content; return dataResponse(content, 200, id); }); }
