import { requireAdmin } from "@/lib/server/admin-auth";
import { loadRecapSummarySource } from "@/lib/server/recap-data";
import { buildRecapSummaryContent } from "@/lib/server/recap-policy";
import { dataResponse, withApi } from "@/lib/server/http";
import { getD1, getStyleSummaryTokenEncryptionKey } from "@/lib/server/runtime";
import { loadCanonicalStyleSummary } from "@/lib/server/style-summary-delivery";

type Params = { params: Promise<{ bookingId: string }> };
export async function GET(request: Request, ctx: Params) { return withApi(async id => { requireAdmin(request); const { bookingId } = await ctx.params, db=getD1(); const source = await loadRecapSummarySource(db, bookingId); if(source.recap.status==="published"){const canonical=await loadCanonicalStyleSummary(db,bookingId,new URL(request.url).origin,getStyleSummaryTokenEncryptionKey());return dataResponse({content:canonical.content,status:"published",styleSummaryUrl:canonical.styleSummaryUrl,linkRecoverable:canonical.linkRecoverable,clientEmail:canonical.clientEmail,emailSent:Boolean(canonical.sentAt),sentAt:canonical.sentAt?new Date(canonical.sentAt).toISOString():null,recipient:canonical.recipient},200,id);} return dataResponse({content:buildRecapSummaryContent(source.recap, source.insights, source.items, source.formulas, source.priorities, source.client, source.booking, source.service),status:String(source.recap.status),styleSummaryUrl:null,linkRecoverable:false,clientEmail:typeof source.client.email==="string"?source.client.email:null,emailSent:false,sentAt:null,recipient:null}, 200, id); }); }
