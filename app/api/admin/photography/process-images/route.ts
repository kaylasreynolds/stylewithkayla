import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  return withApi(async (requestId) => {
    requireAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    const promptBuildId = String(form.get("promptBuildId") ?? "").trim();
    const label = String(form.get("label") ?? "").trim() || null;
    const notes = String(form.get("notes") ?? "").trim() || null;
    const attemptNumber = Number(form.get("attemptNumber") ?? 1);
    if (!(file instanceof File)) throw new ApiError(422, "FILE_REQUIRED", "Choose a process image.");
    if (!allowedTypes.has(file.type)) throw new ApiError(422, "INVALID_FILE", "Upload a JPG, PNG, or WebP image.");
    if (file.size > 25 * 1024 * 1024) throw new ApiError(422, "FILE_TOO_LARGE", "Process images must be 25 MB or smaller.");
    if (!promptBuildId) throw new ApiError(422, "PROMPT_BUILD_REQUIRED", "Save a prompt build first.");
    const exists = await getD1().prepare("SELECT id FROM photo_prompt_builds WHERE id = ?").bind(promptBuildId).first();
    if (!exists) throw new ApiError(404, "PROMPT_BUILD_NOT_FOUND", "The prompt build was not found.");
    const id = `PROC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storageKey = `brand-photography/process/${promptBuildId}/${id}/${safeName}`;
    await getPhotoAssetsBucket().put(storageKey, file.stream(), { httpMetadata: { contentType: file.type } });
    await getD1().prepare(`INSERT INTO photo_process_images (id, prompt_build_id, storage_key, original_filename, mime_type, size_bytes, attempt_number, label, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unreviewed')`)
      .bind(id, promptBuildId, storageKey, file.name, file.type, file.size, Number.isFinite(attemptNumber) ? attemptNumber : 1, label, notes).run();
    return dataResponse({ id, promptBuildId, status: "unreviewed" }, 201, requestId);
  });
}
