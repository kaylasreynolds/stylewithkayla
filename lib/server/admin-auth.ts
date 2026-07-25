import { ApiError } from "@/lib/server/http";
import { getAuthenticatedAdminEmail } from "@/lib/server/access-identity";
import { getAdminEmails } from "@/lib/server/runtime";

export function requireAdmin(request: Request): string {
  const email = getAuthenticatedAdminEmail(request.headers);

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
