import { requireAdmin } from "./admin-auth";
import { EventImageUploadFailure, uploadEventImageAsset } from "./event-image-upload";
import { dataResponse, errorResponse, requestId } from "./http";

type UploadEnv = {
  DB: D1Database;
  PHOTO_ASSETS: R2Bucket;
};

/**
 * Handle the event-image upload directly from the Worker entry point.
 *
 * Keeping this outside vinext avoids its request-body interception for this
 * multipart endpoint while preserving the same authentication, validation,
 * R2, D1, and response behavior used by the App Router route.
 */
export async function handleEventImageUploadRequest(
  request: Request,
  env: UploadEnv,
): Promise<Response> {
  const id = requestId();
  const reference = `IMG-${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;

  try {
    const owner = requireAdmin(request);
    const asset = await uploadEventImageAsset(
      request,
      owner,
      reference,
      env.PHOTO_ASSETS,
      env.DB,
    );
    return dataResponse({ asset }, 201, id);
  } catch (error) {
    return errorResponse(
      error,
      error instanceof EventImageUploadFailure ? reference : id,
    );
  }
}
