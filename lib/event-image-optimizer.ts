import { EVENT_IMAGE_MAX_BYTES } from "./event-editor-client";

export const EVENT_IMAGE_TARGET_BYTES = 3 * 1024 * 1024;
export const EVENT_IMAGE_MAX_LONG_EDGE = 2400;
export const EVENT_IMAGE_OPTIMIZATION_ERROR = "We couldn't optimize this image. Please choose a JPG, PNG, or WebP image and try again.";

export type OptimizedEventImage = {
  file: File;
  originalBytes: number;
  optimizedBytes: number;
  width: number;
  height: number;
  wasOptimized: boolean;
};

type DecodedImage = { source: CanvasImageSource; width: number; height: number; close?: () => void };
export type ImageOptimizerRuntime = {
  decode(file: File): Promise<DecodedImage>;
  render(image: DecodedImage, width: number, height: number): { hasAlpha(): boolean; encode(type: string, quality?: number): Promise<Blob | null> };
};

const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function safeEventImageFilename(originalName: string, type: string): string {
  const extension = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  const stem = originalName.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "event-image";
  return `${stem}.${extension}`;
}

function browserRuntime(): ImageOptimizerRuntime {
  return {
    async decode(file) {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    },
    render(image, width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
      if (!context) throw new Error("canvas unavailable");
      context.drawImage(image.source, 0, 0, width, height);
      return {
        hasAlpha() {
          const pixels = context.getImageData(0, 0, width, height).data;
          for (let index = 3; index < pixels.length; index += 4) if (pixels[index] < 255) return true;
          return false;
        },
        encode(type, quality) {
          return new Promise(resolve => canvas.toBlob(resolve, type, quality));
        },
      };
    },
  };
}

export async function optimizeEventImage(file: File, runtime: ImageOptimizerRuntime = browserRuntime()): Promise<OptimizedEventImage> {
  if (!supportedTypes.has(file.type.toLowerCase())) throw new Error(EVENT_IMAGE_OPTIMIZATION_ERROR);
  let decoded: DecodedImage | undefined;
  try {
    decoded = await runtime.decode(file);
    const scale = Math.min(1, EVENT_IMAGE_MAX_LONG_EDGE / Math.max(decoded.width, decoded.height));
    let width = Math.max(1, Math.round(decoded.width * scale));
    let height = Math.max(1, Math.round(decoded.height * scale));
    const alreadyTargeted = scale === 1 && file.size <= EVENT_IMAGE_TARGET_BYTES;
    if (alreadyTargeted) return { file, originalBytes: file.size, optimizedBytes: file.size, width, height, wasOptimized: false };

    let rendered = runtime.render(decoded, width, height);
    const hasAlpha = rendered.hasAlpha();
    const candidates: Blob[] = [];
    const add = (blob: Blob | null) => { if (blob && supportedTypes.has(blob.type)) candidates.push(blob); };
    if (hasAlpha) {
      add(await rendered.encode("image/webp", 0.84));
      add(await rendered.encode("image/png"));
    } else {
      for (const quality of [0.84, 0.76, 0.68]) add(await rendered.encode("image/webp", quality));
      add(await rendered.encode("image/jpeg", 0.84));
    }

    let output = candidates.find(candidate => candidate.size <= EVENT_IMAGE_TARGET_BYTES) ?? candidates.sort((a, b) => a.size - b.size)[0];
    // Reduce dimensions once more when encoding quality alone cannot reach the web target.
    if (output && output.size > EVENT_IMAGE_TARGET_BYTES && Math.max(width, height) > 600) {
      const reduction = Math.max(0.5, Math.sqrt(EVENT_IMAGE_TARGET_BYTES / output.size) * 0.95);
      width = Math.max(1, Math.round(width * reduction)); height = Math.max(1, Math.round(height * reduction));
      rendered = runtime.render(decoded, width, height);
      const reduced = await rendered.encode(hasAlpha ? "image/webp" : "image/jpeg", 0.76);
      if (reduced?.type && reduced.size < output.size) output = reduced;
    }
    if (!output || output.size > EVENT_IMAGE_MAX_BYTES) throw new Error("output too large");
    // PNG is retained when alpha requires it or conversion would make the original larger.
    if (scale === 1 && output.size >= file.size) return { file, originalBytes: file.size, optimizedBytes: file.size, width: decoded.width, height: decoded.height, wasOptimized: false };
    const optimized = new File([output], safeEventImageFilename(file.name, output.type), { type: output.type, lastModified: Date.now() });
    return { file: optimized, originalBytes: file.size, optimizedBytes: optimized.size, width, height, wasOptimized: true };
  } catch (error) {
    if (error instanceof Error && error.message === EVENT_IMAGE_OPTIMIZATION_ERROR) throw error;
    throw new Error(EVENT_IMAGE_OPTIMIZATION_ERROR);
  } finally {
    decoded?.close?.();
  }
}

export function formatImageBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MiB` : `${Math.max(1, Math.round(bytes / 1024))} KiB`;
}
