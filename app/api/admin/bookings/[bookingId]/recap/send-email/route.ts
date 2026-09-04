import { requireAdmin } from "@/lib/server/admin-auth";
import { dataResponse, withApi } from "@/lib/server/http";
import { getAppointmentEmailConfig, getD1, getStyleSummaryTokenEncryptionKey } from "@/lib/server/runtime";
import { deliverStyleSummaryEmail } from "@/lib/server/style-summary-delivery";
type Params={params:Promise<{bookingId:string}>};
export async function POST(request:Request,ctx:Params){return withApi(async id=>{requireAdmin(request);const{bookingId}=await ctx.params;return dataResponse(await deliverStyleSummaryEmail(getD1(),bookingId,new URL(request.url).origin,{key:getStyleSummaryTokenEncryptionKey(),config:getAppointmentEmailConfig()}),200,id);});}
