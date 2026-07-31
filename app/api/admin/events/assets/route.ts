import { handleEventImageUploadRequest } from "@/lib/server/event-image-route";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

export async function POST(request: Request) {
  return handleEventImageUploadRequest(request, {
    DB: getD1(),
    PHOTO_ASSETS: getPhotoAssetsBucket(),
  });
}
