import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, dataResponse, readJsonObject, requiredString, optionalString, withApi } from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

export async function POST(request: Request) {
  return withApi(async (requestId) => {
    const email = requireAdmin(request);
    const body = await readJsonObject(request);
    const sceneId = requiredString(body.sceneId, "sceneId", 40);
    const sceneName = requiredString(body.sceneName, "sceneName", 120);
    const assembledPrompt = requiredString(body.assembledPrompt, "assembledPrompt", 60000);
    const buildNotes = optionalString(body.buildNotes, "buildNotes", 5000);
    if (!body.moduleSelections || typeof body.moduleSelections !== "object" || Array.isArray(body.moduleSelections)) {
      throw new ApiError(422, "VALIDATION_ERROR", "Module selections are required.");
    }
    const id = `PB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await getD1().prepare(`INSERT INTO photo_prompt_builds (id, scene_id, scene_name, module_selections, assembled_prompt, build_notes, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'ready', ?)`)
      .bind(id, sceneId, sceneName, JSON.stringify(body.moduleSelections), assembledPrompt, buildNotes, email).run();
    return dataResponse({ id, status: "ready" }, 201, requestId);
  });
}

export async function GET(request: Request) {
  return withApi(async (requestId) => {
    requireAdmin(request);
    const rows = (await getD1().prepare(`SELECT id, scene_id AS sceneId, scene_name AS sceneName, status, created_at AS createdAt FROM photo_prompt_builds ORDER BY created_at DESC LIMIT 50`).all()).results;
    return dataResponse({ promptBuilds: rows }, 200, requestId);
  });
}
