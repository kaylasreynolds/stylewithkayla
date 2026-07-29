import { requireAdmin } from "@/lib/server/admin-auth";
import { EVENT_IMAGE_MAX_BYTES, EVENT_IMAGE_TOO_LARGE_MESSAGE } from "@/lib/event-editor-client";
import { inspectEventImage } from "@/lib/server/event-images";
import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

export async function POST(request: Request) {
  return withApi(async requestId => {
    const owner = requireAdmin(request);
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > EVENT_IMAGE_MAX_BYTES + 64 * 1024) throw new ApiError(413, "EVENT_IMAGE_TOO_LARGE", EVENT_IMAGE_TOO_LARGE_MESSAGE);
    const form = await request.formData(), file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(422, "FILE_REQUIRED", "Choose a JPG, PNG, or WebP image.");
    if (file.size > EVENT_IMAGE_MAX_BYTES) throw new ApiError(413, "EVENT_IMAGE_TOO_LARGE", EVENT_IMAGE_TOO_LARGE_MESSAGE);
    // Detection is exclusively from bytes: file.name and file.type are deliberately ignored.
    const bytes = new Uint8Array(await file.arrayBuffer()), inspected = inspectEventImage(bytes);
    const assetId = crypto.randomUUID(), storageKey = `event-images/${owner}/${assetId}.${inspected.extension}`;
    await getPhotoAssetsBucket().put(storageKey, bytes, { httpMetadata: { contentType: inspected.mimeType } });
    await getD1().prepare("INSERT INTO event_image_assets(id,storage_key,owner_email,mime_type,extension,size_bytes,width,height,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(assetId, storageKey, owner, inspected.mimeType, inspected.extension, inspected.sizeBytes, inspected.width, inspected.height, Date.now()).run();
    return dataResponse({ asset: { id: assetId, mimeType: inspected.mimeType, sizeBytes: inspected.sizeBytes, width: inspected.width, height: inspected.height, previewUrl: `/api/admin/events/assets/${assetId}` } }, 201, requestId);
  });
}
