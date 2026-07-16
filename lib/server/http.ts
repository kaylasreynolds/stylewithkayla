export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly fieldErrors?: Record<string, string>) { super(message); }
}
export const requestId = () => crypto.randomUUID();
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
export function dataResponse(data: unknown, status = 200, id = requestId()) { return Response.json({ data, requestId: id }, { status, headers }); }
export function errorResponse(error: unknown, id = requestId()) {
  const current = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
 if (!(error instanceof ApiError)) {
  console.error("Unhandled API error", {
    requestId: id,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  });
}
  return Response.json({ error: { code: current.code, message: current.message, ...(current.fieldErrors ? { fieldErrors: current.fieldErrors } : {}) }, requestId: id }, { status: current.status, headers });
}
export async function withApi(action: (id: string) => Promise<Response>) { const id = requestId(); try { return await action(id); } catch (error) { return errorResponse(error, id); } }
export async function readJsonObject(request: Request) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) throw new ApiError(400, "INVALID_CONTENT_TYPE", "Send the request as JSON.");
  let value: unknown; try { value = await request.json(); } catch { throw new ApiError(400, "INVALID_JSON", "The request contains invalid JSON."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "INVALID_REQUEST", "The request must be a JSON object.");
  return value as Record<string, unknown>;
}
export function rejectUnexpectedKeys(value: Record<string, unknown>, allowed: readonly string[], path = "request") {
  const allowedSet = new Set(allowed); const unexpected = Object.keys(value).find((key) => !allowedSet.has(key));
  if (unexpected) throw new ApiError(400, "UNEXPECTED_FIELD", `${path} contains an unexpected field: ${unexpected}.`);
}
export function requiredString(value: unknown, field: string, max: number) {
  if (typeof value !== "string" || !value.trim()) throw validation(field, "This field is required.");
  const result = value.replace(/\r\n?/g, "\n").trim(); if (result.length > max) throw validation(field, `Use ${max} characters or fewer.`); return result;
}
export function optionalString(value: unknown, field: string, max: number) { return value === null || value === undefined || value === "" ? null : requiredString(value, field, max); }
export function validation(field: string, message: string) { return new ApiError(422, "VALIDATION_ERROR", "Please check the highlighted fields.", { [field]: message }); }
