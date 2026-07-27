import { ApiError, errorResponse } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const row = await getD1().prepare("SELECT a.storage_key storageKey,a.mime_type mimeType FROM event_image_assets a JOIN events e ON e.image_asset_id=a.id WHERE a.id=? AND e.status='published' LIMIT 1").bind(assetId).first<{storageKey:string;mimeType:string}>();
    if (!row) throw new ApiError(404, "EVENT_IMAGE_NOT_FOUND", "The image was not found.");
    const object = await getPhotoAssetsBucket().get(row.storageKey); if (!object) throw new ApiError(404, "EVENT_IMAGE_NOT_FOUND", "The image was not found.");
    return new Response(object.body, { headers: { "Content-Type": row.mimeType, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return errorResponse(error); }
}
