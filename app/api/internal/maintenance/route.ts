import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { runRetentionMaintenance } from "@/lib/server/privacy-operations";
import { getD1, getMaintenanceSecret } from "@/lib/server/runtime";

export async function POST(request: Request) {
  return withApi(async id => {
    const secret = getMaintenanceSecret();
    if (!secret) throw new ApiError(503,"MAINTENANCE_NOT_CONFIGURED","Scheduled maintenance is not configured.");
    if (request.headers.get("authorization") !== `Bearer ${secret}`) throw new ApiError(401,"MAINTENANCE_AUTH_REQUIRED","Maintenance authorization is required.");
    return dataResponse(await runRetentionMaintenance(getD1()),200,id);
  });
}

