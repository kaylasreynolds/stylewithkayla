export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const EVENT_IMAGE_TOO_LARGE_MESSAGE = "Event images must be 5 MiB or smaller.";

type UploadAsset = {
  id: string;
  previewUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
};

type UploadPayload = {
  data?: { asset?: UploadAsset };
  error?: { message?: string };
};

const genericUploadMessage = "The image could not be uploaded. Please try again.";

export function eventImageFileError(sizeBytes: number): string | null {
  return sizeBytes > EVENT_IMAGE_MAX_BYTES ? EVENT_IMAGE_TOO_LARGE_MESSAGE : null;
}

export function readUploadResponse(status: number, contentType: string | null, body: string): UploadAsset {
  if (status === 413) throw new Error(EVENT_IMAGE_TOO_LARGE_MESSAGE);

  const trimmed = body.trim();
  let payload: UploadPayload | null = null;
  if (trimmed && contentType?.toLowerCase().includes("json")) {
    try {
      payload = JSON.parse(trimmed) as UploadPayload;
    } catch {
      throw new Error(genericUploadMessage);
    }
  }

  if (status < 200 || status >= 300) {
    const isHtml = contentType?.toLowerCase().includes("html") || /^\s*</.test(trimmed);
    throw new Error(payload?.error?.message || (!isHtml && trimmed ? trimmed : genericUploadMessage));
  }

  if (!payload?.data?.asset) throw new Error(genericUploadMessage);
  return payload.data.asset;
}

export type EventSubmissionTarget = {
  eventId?: string;
  method: "POST" | "PATCH";
  url: string;
};

export class EventSubmissionGuard {
  private active = false;
  private authoritativeEventId?: string;

  constructor(eventId?: string) {
    this.authoritativeEventId = eventId;
  }

  begin(): EventSubmissionTarget | null {
    if (this.active) return null;
    this.active = true;
    const eventId = this.authoritativeEventId;
    return eventId
      ? { eventId, method: "PATCH", url: `/api/admin/events/${eventId}` }
      : { method: "POST", url: "/api/admin/events" };
  }

  captureEventId(eventId: string) {
    if (!eventId) throw new Error("The saved event did not include an ID.");
    if (this.authoritativeEventId && this.authoritativeEventId !== eventId) {
      throw new Error("The saved event ID changed unexpectedly.");
    }
    this.authoritativeEventId = eventId;
  }

  finish() {
    this.active = false;
  }
}
