import { ApiError } from "@/lib/server/http";
import { getAdminEmails } from "@/lib/server/runtime";

export function requireAdmin(request: Request): string {
  const email =
    request.headers
      .get("oai-authenticated-user-email")
      ?.trim()
      .toLowerCase() ??
    request.headers
      .get("cf-access-authenticated-user-email")
      ?.trim()
      .toLowerCase();

  if (!email) {
    throw new ApiError(
      401,
      "ADMIN_AUTH_REQUIRED",
      "Sign in to access appointment requests.",
    );
  }

  if (!getAdminEmails().has(email)) {
    throw new ApiError(
      403,
      "ADMIN_ACCESS_DENIED",
      "This account is not authorized for admin access.",
    );
  }

  return email;
}