import { requireAdmin } from "@/lib/server/admin-auth";
import { EventImageUploadFailure, uploadEventImageAsset } from "@/lib/server/event-image-upload";
import { dataResponse, errorResponse, requestId } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

export async function POST(request: Request) {
  const id = requestId(), reference = `IMG-${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
  try {
    const owner = requireAdmin(request);
    const asset = await uploadEventImageAsset(request, owner, reference, getPhotoAssetsBucket(), getD1());
    return dataResponse({ asset }, 201, id);
  } catch (error) {
    return errorResponse(error, error instanceof EventImageUploadFailure ? reference : id);
  }
}
