import { ApiError, validation } from "./http";
import { EVENT_IMAGE_MAX_BYTES, EVENT_IMAGE_TOO_LARGE_MESSAGE } from "../event-editor-client";

export { EVENT_IMAGE_MAX_BYTES } from "../event-editor-client";
export const EVENT_IMAGE_MIN_DIMENSION = 600;
export const EVENT_IMAGE_MAX_DIMENSION = 4000;
export const EVENT_IMAGE_ALT_MAX = 240;
export type InspectedImage = { mimeType: "image/jpeg" | "image/png" | "image/webp"; extension: "jpg" | "png" | "webp"; width: number; height: number; sizeBytes: number };

const fail = (message: string) => { throw new ApiError(422, "INVALID_EVENT_IMAGE", message); };
const u16le = (b: Uint8Array, n: number) => b[n] | (b[n + 1] << 8);
const u24le = (b: Uint8Array, n: number) => b[n] | (b[n + 1] << 8) | (b[n + 2] << 16);
const u32be = (b: Uint8Array, n: number) => ((b[n] << 24) | (b[n + 1] << 16) | (b[n + 2] << 8) | b[n + 3]) >>> 0;

export function inspectEventImage(bytes: Uint8Array): InspectedImage {
  if (!bytes.length) fail("The image is empty.");
  if (bytes.length > EVENT_IMAGE_MAX_BYTES) fail(EVENT_IMAGE_TOO_LARGE_MESSAGE);
  let mimeType: InspectedImage["mimeType"], extension: InspectedImage["extension"], width = 0, height = 0;
  if (bytes.length >= 24 && bytes.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i])) {
    mimeType = "image/png"; extension = "png"; width = u32be(bytes, 16); height = u32be(bytes, 20);
  } else if (bytes.length >= 30 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    mimeType = "image/webp"; extension = "webp"; const kind = String.fromCharCode(...bytes.slice(12, 16));
    if (kind === "VP8X") { width = u24le(bytes, 24) + 1; height = u24le(bytes, 27) + 1; }
    else if (kind === "VP8L" && bytes[20] === 0x2f) { const bits = (bytes[21] | bytes[22] << 8 | bytes[23] << 16 | bytes[24] << 24) >>> 0; width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; }
    else if (kind === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) { width = u16le(bytes, 26) & 0x3fff; height = u16le(bytes, 28) & 0x3fff; }
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    mimeType = "image/jpeg"; extension = "jpg"; let i = 2;
    while (i + 8 < bytes.length) { if (bytes[i] !== 0xff) { i++; continue; } const marker = bytes[i + 1], length = (bytes[i + 2] << 8) | bytes[i + 3]; if (length < 2) break; if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) { height = (bytes[i + 5] << 8) | bytes[i + 6]; width = (bytes[i + 7] << 8) | bytes[i + 8]; break; } i += 2 + length; }
  } else fail("The file contents are not a supported JPG, PNG, or WebP image.");
  if (!width || !height) fail("The image dimensions could not be verified.");
  if (width < EVENT_IMAGE_MIN_DIMENSION || height < EVENT_IMAGE_MIN_DIMENSION || width > EVENT_IMAGE_MAX_DIMENSION || height > EVENT_IMAGE_MAX_DIMENSION) fail("Image width and height must each be between 600 and 4000 pixels.");
  return { mimeType: mimeType!, extension: extension!, width, height, sizeBytes: bytes.length };
}

/** Decode multipart first so request headers and multipart overhead cannot count as image bytes. */
export async function readEventImageUpload(request: Request, setStage: (stage: string) => void = () => {}) {
  setStage("multipart_parse");
  const form = await request.formData();
  setStage("file_field");
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(422, "FILE_REQUIRED", "Choose a JPG, PNG, or WebP image.");
  setStage("size_validation");
  if (file.size > EVENT_IMAGE_MAX_BYTES) throw new ApiError(413, "EVENT_IMAGE_TOO_LARGE", EVENT_IMAGE_TOO_LARGE_MESSAGE);
  // Detection is exclusively from bytes: file.name and file.type are deliberately ignored.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size) throw new ApiError(422, "INVALID_EVENT_IMAGE", "The uploaded image could not be read completely.");
  setStage("mime_signature_dimension_validation");
  return { file, bytes, inspected: inspectEventImage(bytes) };
}

export function meaningfulAlt(value: unknown) {
  if (typeof value !== "string") throw validation("imageAlt", "Describe the image for visitors using assistive technology.");
  const alt = value.trim().replace(/\s+/g, " ");
  if (alt.length < 8 || alt.length > EVENT_IMAGE_ALT_MAX || !/[a-z]{3}/i.test(alt)) throw validation("imageAlt", `Alternative text must be meaningful (8–${EVENT_IMAGE_ALT_MAX} characters).`);
  return alt;
}

export const eventAssetOwnedBy = (assetOwner: unknown, actorEmail: string) => typeof assetOwner === "string" && assetOwner.toLowerCase() === actorEmail.toLowerCase();
