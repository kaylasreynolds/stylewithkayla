import { requireAdmin } from "@/lib/server/admin-auth";
import { dataResponse, withApi } from "@/lib/server/http";
import { maintenanceSummary, runRetentionMaintenance } from "@/lib/server/privacy-operations";
import { getD1 } from "@/lib/server/runtime";

export async function GET(request: Request) {
  return withApi(async id => { requireAdmin(request); return dataResponse(await maintenanceSummary(getD1()),200,id); });
}

export async function POST(request: Request) {
  return withApi(async id => { requireAdmin(request,true); return dataResponse(await runRetentionMaintenance(getD1()),200,id); });
}

