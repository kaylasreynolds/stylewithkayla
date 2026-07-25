import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { getD1, getPhotoAssetsBucket } from "@/lib/server/runtime";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const orientations = new Set(["landscape", "portrait", "square", "vertical"]);

export async function POST(request: Request) {
  return withApi(async (requestId) => {
    const email = requireAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    const name = String(form.get("name") ?? "").trim();
    const sceneId = String(form.get("sceneId") ?? "").trim();
    const promptBuildId = String(form.get("promptBuildId") ?? "").trim();
    const sourceProcessImageId = String(form.get("sourceProcessImageId") ?? "").trim() || null;
    const orientation = String(form.get("orientation") ?? "portrait").trim();
    const finalNotes = String(form.get("finalNotes") ?? "").trim() || null;
    const approvedUses = String(form.get("approvedUses") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    if (!(file instanceof File)) throw new ApiError(422, "FILE_REQUIRED", "Choose the final master image.");
    if (!allowedTypes.has(file.type)) throw new ApiError(422, "INVALID_FILE", "Upload a JPG, PNG, or WebP image.");
    if (file.size > 50 * 1024 * 1024) throw new ApiError(422, "FILE_TOO_LARGE", "Final images must be 50 MB or smaller.");
    if (!name || !sceneId || !promptBuildId) throw new ApiError(422, "MISSING_FIELDS", "Name, scene, and prompt build are required.");
    if (!orientations.has(orientation)) throw new ApiError(422, "INVALID_ORIENTATION", "Choose a valid orientation.");
    const build = await getD1().prepare("SELECT id FROM photo_prompt_builds WHERE id = ?").bind(promptBuildId).first();
    if (!build) throw new ApiError(404, "PROMPT_BUILD_NOT_FOUND", "The prompt build was not found.");
    const id = `AST-${sceneId.replace(/[^A-Z0-9]/gi, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storageKey = `brand-photography/final/${sceneId}/${id}/master/${safeName}`;
    await getPhotoAssetsBucket().put(storageKey, file.stream(), { httpMetadata: { contentType: file.type } });
    await getD1().prepare(`INSERT INTO photo_assets (id, scene_id, prompt_build_id, source_process_image_id, name, storage_key, original_filename, mime_type, size_bytes, orientation, approval_status, approved_uses, final_notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`)
      .bind(id, sceneId, promptBuildId, sourceProcessImageId, name, storageKey, file.name, file.type, file.size, orientation, JSON.stringify(approvedUses), finalNotes, email).run();
    return dataResponse({ id, status: "approved" }, 201, requestId);
  });
}

export async function GET(request: Request) {
  return withApi(async (requestId) => {
    requireAdmin(request);
    const rows = (await getD1().prepare(`SELECT id, name, scene_id AS sceneId, prompt_build_id AS promptBuildId, orientation, approval_status AS approvalStatus, approved_uses AS approvedUses, original_filename AS originalFilename, size_bytes AS sizeBytes, created_at AS createdAt FROM photo_assets ORDER BY created_at DESC LIMIT 100`).all()).results;
    return dataResponse({ assets: rows.map((row: any) => ({ ...row, approvedUses: JSON.parse(row.approvedUses || "[]") })) }, 200, requestId);
  });
}
