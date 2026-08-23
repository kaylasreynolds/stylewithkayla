import { requireAdmin } from "@/lib/server/admin-auth";
import { loadRecapSummarySource } from "@/lib/server/recap-data";
import { buildRecapSummaryContent } from "@/lib/server/recap-policy";
import { dataResponse, withApi } from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

type Params = { params: Promise<{ bookingId: string }> };
export async function GET(request: Request, ctx: Params) { return withApi(async id => { requireAdmin(request); const { bookingId } = await ctx.params; const source = await loadRecapSummarySource(getD1(), bookingId); return dataResponse(buildRecapSummaryContent(source.recap, source.insights, source.items, source.formulas, source.priorities, source.client, source.booking, source.service), 200, id); }); }
