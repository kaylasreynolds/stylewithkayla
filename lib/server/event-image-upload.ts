import { ApiError } from "./http";
import { readEventImageUpload, type InspectedImage } from "./event-images";

export const EVENT_IMAGE_UPLOAD_MESSAGE = "This image could not be uploaded. Please try again.";

export type EventImageAsset = InspectedImage & { id: string; previewUrl: string };
type Bucket = Pick<R2Bucket, "put" | "delete">;
type Database = Pick<D1Database, "prepare">;

export type UploadDiagnostic = {
  reference: string;
  stage: string;
  status: number;
  fileBytes?: number;
  detectedMime?: string;
  category: string;
};

export class EventImageUploadFailure extends ApiError {
  constructor(readonly diagnostic: UploadDiagnostic) {
    super(500, "EVENT_IMAGE_UPLOAD_FAILED", EVENT_IMAGE_UPLOAD_MESSAGE);
  }
}

/** Store an already-authenticated event image, compensating R2 if D1 fails. */
export async function uploadEventImageAsset(
  request: Request,
  owner: string,
  reference: string,
  bucket: Bucket,
  db: Database,
): Promise<EventImageAsset> {
  let stage = "multipart_parse";
  let fileBytes: number | undefined;
  let detectedMime: string | undefined;
  let storageKey: string | undefined;
  let wroteObject = false;

  try {
    const upload = await readEventImageUpload(request, next => { stage = next; });
    fileBytes = upload.file.size;
    detectedMime = upload.inspected.mimeType;
    const id = crypto.randomUUID();
    storageKey = `event-images/${owner}/${id}.${upload.inspected.extension}`;

    stage = "r2_write";
    await bucket.put(storageKey, upload.bytes, { httpMetadata: { contentType: upload.inspected.mimeType } });
    wroteObject = true;

    stage = "d1_insert";
    await db.prepare("INSERT INTO event_image_assets(id,storage_key,owner_email,mime_type,extension,size_bytes,width,height,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(id, storageKey, owner, upload.inspected.mimeType, upload.inspected.extension, upload.inspected.sizeBytes, upload.inspected.width, upload.inspected.height, Date.now()).run();

    stage = "response_construct";
    return { id, ...upload.inspected, previewUrl: `/api/admin/events/assets/${id}` };
  } catch (error) {
    if (wroteObject && storageKey) {
      try { await bucket.delete(storageKey); }
      catch { console.error("Event image upload cleanup failed", { reference, stage: "r2_cleanup", status: 500, fileBytes, detectedMime, category: "R2_DELETE" }); }
    }
    if (error instanceof ApiError) {
      console.warn("Event image upload rejected", { reference, stage, status: error.status, fileBytes, detectedMime, category: error.code });
      throw error;
    }
    const category = stage === "r2_write" ? "R2_PUT" : stage === "d1_insert" ? "D1_INSERT" : "UPLOAD_INTERNAL";
    const diagnostic = { reference, stage, status: 500, fileBytes, detectedMime, category };
    console.error("Event image upload failed", diagnostic);
    throw new EventImageUploadFailure(diagnostic);
  }
}
