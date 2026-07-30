export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const EVENT_IMAGE_TOO_LARGE_MESSAGE = "Event images must be 5 MiB or smaller.";

export const EVENT_COST_DEFAULTS = {
  complimentary: "Complimentary",
  purchase_required: "Purchase required",
  free_with_rsvp: "Free with RSVP",
  not_applicable: "Not applicable",
} as const;

export function defaultEventCostLabel(costType: string): string {
  return EVENT_COST_DEFAULTS[costType as keyof typeof EVENT_COST_DEFAULTS] ?? "";
}

export function hasEventOffer(value: Record<string, unknown>): boolean {
  return ["offer", "offerDetails", "offerTerms"].some(key => String(value[key] ?? "").trim().length > 0);
}

export function withoutEventOffer<T extends Record<string, unknown>>(value: T): T {
  return { ...value, offer: "", offerDetails: "", offerTerms: "" };
}

/** Fields an event editor is allowed to send to the create and update APIs. */
export const EDITABLE_EVENT_FIELDS = [
  "title", "eventLabel", "customLabel", "shortDescription", "description",
  "offer", "offerDetails", "offerTerms", "eventDate", "startTime", "endTime",
  "allDay", "timezone", "location", "locationDetails", "directionsUrl",
  "attendanceType", "capacity", "unlimitedCapacity", "maxGuests", "allowGuestNames",
  "registrationOpensDate", "registrationOpensTime", "registrationClosesDate",
  "registrationClosesTime", "allowDuplicateRegistration", "appointmentRequired",
  "appointmentRecommended", "costType", "costLabel", "ctaLabel", "ctaAction",
  "ctaUrl", "ctaEmail", "ctaPhone", "sharingEnabled", "shareMessage",
  "imageAssetId", "imageAlt",
] as const;

export function buildEventPayload(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    EDITABLE_EVENT_FIELDS.filter(field => Object.hasOwn(value, field)).map(field => [field, value[field]]),
  );
}

export type UploadAsset = {
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

export function isUploadedEventImage(asset: UploadAsset | null, imageAssetId: unknown): asset is UploadAsset {
  return Boolean(
    asset
    && typeof asset.id === "string" && asset.id.trim()
    && imageAssetId === asset.id
    && typeof asset.previewUrl === "string" && asset.previewUrl.trim()
    && Number.isFinite(asset.width) && asset.width > 0
    && Number.isFinite(asset.height) && asset.height > 0
    && Number.isFinite(asset.sizeBytes) && asset.sizeBytes > 0,
  );
}

export function eventImageFileError(sizeBytes: number): string | null {
  return sizeBytes > EVENT_IMAGE_MAX_BYTES ? EVENT_IMAGE_TOO_LARGE_MESSAGE : null;
}

/** Keep the File used for the size display identical to the multipart file part. */
export function eventImageUploadForm(file: File): FormData {
  const form = new FormData();
  form.set("file", file);
  return form;
}

export function readUploadResponse(status: number, contentType: string | null, body: string): UploadAsset {
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
    // Only our structured file validation may claim that the image itself is too large.
    throw new Error(payload?.error?.message || (!isHtml && status !== 413 && trimmed ? trimmed : genericUploadMessage));
  }

  const asset = payload?.data?.asset;
  if (!asset || !isUploadedEventImage(asset, asset.id)) throw new Error(genericUploadMessage);
  return asset;
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
