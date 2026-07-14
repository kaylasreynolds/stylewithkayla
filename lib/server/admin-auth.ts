import { ApiError } from "./http"; import { getAdminEmails } from "./runtime";
export type AdminPrincipal = { subjectId: string; email: string };
export function requireAdmin(request: Request, mutation = false): AdminPrincipal {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (!email) throw new ApiError(401, "ADMIN_AUTH_REQUIRED", "Sign in to access appointment requests.");
  if (!getAdminEmails().has(email)) throw new ApiError(403, "ADMIN_ACCESS_DENIED", "This account cannot manage appointment requests.");
  if (mutation) { const origin = request.headers.get("origin"); if (!origin || origin !== new URL(request.url).origin) throw new ApiError(403, "CSRF_CHECK_FAILED", "Refresh the page and try again."); }
  return { subjectId: `chatgpt:${email}`, email };
}
