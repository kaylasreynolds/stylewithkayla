import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, errorResponse } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const owner = requireAdmin(request), { assetId } = await params;
    const row = await getD1().prepare("SELECT storage_key storageKey,mime_type mimeType FROM event_image_assets WHERE id=? AND owner_email=?").bind(assetId, owner).first<{storageKey:string;mimeType:string}>();
    if (!row) throw new ApiError(404, "EVENT_IMAGE_NOT_FOUND", "The image asset was not found.");
    const object = await getPhotoAssetsBucket().get(row.storageKey);
    if (!object) throw new ApiError(404, "EVENT_IMAGE_FILE_NOT_FOUND", "The image file is unavailable.");
    return new Response(object.body, { headers: { "Content-Type": row.mimeType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return errorResponse(error); }
}
