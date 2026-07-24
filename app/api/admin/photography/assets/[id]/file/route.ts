import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, errorResponse } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const row = await getD1().prepare("SELECT storage_key AS storageKey, original_filename AS originalFilename, mime_type AS mimeType FROM photo_assets WHERE id = ?").bind(id).first<{ storageKey: string; originalFilename: string; mimeType: string }>();
    if (!row) throw new ApiError(404, "ASSET_NOT_FOUND", "The permanent asset was not found.");
    const object = await getPhotoAssetsBucket().get(row.storageKey);
    if (!object) throw new ApiError(404, "FILE_NOT_FOUND", "The permanent file is missing from storage.");
    return new Response(object.body, {
      headers: {
        "Content-Type": row.mimeType,
        "Content-Disposition": `attachment; filename="${row.originalFilename.replace(/\"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
