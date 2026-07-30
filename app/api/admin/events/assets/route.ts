import { requireAdmin } from "@/lib/server/admin-auth";
import { readEventImageUpload } from "@/lib/server/event-images";
import { dataResponse, withApi } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

export async function POST(request: Request) {
  return withApi(async requestId => {
    const owner = requireAdmin(request);
    // The image limit applies to the received file part, never to multipart framing.
    const { bytes, inspected } = await readEventImageUpload(request);
    const assetId = crypto.randomUUID(), storageKey = `event-images/${owner}/${assetId}.${inspected.extension}`;
    await getPhotoAssetsBucket().put(storageKey, bytes, { httpMetadata: { contentType: inspected.mimeType } });
    await getD1().prepare("INSERT INTO event_image_assets(id,storage_key,owner_email,mime_type,extension,size_bytes,width,height,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(assetId, storageKey, owner, inspected.mimeType, inspected.extension, inspected.sizeBytes, inspected.width, inspected.height, Date.now()).run();
    return dataResponse({ asset: { id: assetId, mimeType: inspected.mimeType, sizeBytes: inspected.sizeBytes, width: inspected.width, height: inspected.height, previewUrl: `/api/admin/events/assets/${assetId}` } }, 201, requestId);
  });
}
