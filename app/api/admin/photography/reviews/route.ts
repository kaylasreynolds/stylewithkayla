import { requireAdmin } from "@/lib/server/admin-auth";
import { ApiError, dataResponse, readJsonObject, requiredString, optionalString, withApi } from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

const decisions = new Set(["needs_refinement", "rejected", "final_candidate"]);

export async function POST(request: Request) {
  return withApi(async (requestId) => {
    const email = requireAdmin(request);
    const body = await readJsonObject(request);
    const processImageId = requiredString(body.processImageId, "processImageId", 60);
    const decision = requiredString(body.decision, "decision", 40);
    if (!decisions.has(decision)) throw new ApiError(422, "INVALID_DECISION", "Choose a valid review decision.");
    if (!body.results || typeof body.results !== "object" || Array.isArray(body.results)) throw new ApiError(422, "RESULTS_REQUIRED", "Complete the review checklist.");
    const id = `REV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const whatWorks = optionalString(body.whatWorks, "whatWorks", 8000);
    const correctionsNeeded = optionalString(body.correctionsNeeded, "correctionsNeeded", 8000);
    const refinementInstruction = optionalString(body.refinementInstruction, "refinementInstruction", 12000);
    const db = getD1();
    const exists = await db.prepare("SELECT id FROM photo_process_images WHERE id = ?").bind(processImageId).first();
    if (!exists) throw new ApiError(404, "PROCESS_IMAGE_NOT_FOUND", "The process image was not found.");
    await db.prepare(`INSERT INTO photo_reviews (id, process_image_id, results, what_works, corrections_needed, refinement_instruction, decision, reviewed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(process_image_id) DO UPDATE SET results=excluded.results, what_works=excluded.what_works, corrections_needed=excluded.corrections_needed, refinement_instruction=excluded.refinement_instruction, decision=excluded.decision, reviewed_by=excluded.reviewed_by, updated_at=(unixepoch() * 1000)`)
      .bind(id, processImageId, JSON.stringify(body.results), whatWorks, correctionsNeeded, refinementInstruction, decision, email).run();
    const status = decision === "final_candidate" ? "final_candidate" : decision;
    await db.prepare("UPDATE photo_process_images SET status = ? WHERE id = ?").bind(status, processImageId).run();
    return dataResponse({ processImageId, decision }, 200, requestId);
  });
}
