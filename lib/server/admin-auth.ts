import { ApiError } from "@/lib/server/http";
import {
  getAdminEmails,
  getLocalAdminEmail,
} from "@/lib/server/runtime";

export function requireAdmin(request: Request): string {
  const url = new URL(request.url);

  const authenticatedEmail =
    request.headers
      .get("oai-authenticated-user-email")
      ?.trim()
      .toLowerCase() ??
    request.headers
      .get("cf-access-authenticated-user-email")
      ?.trim()
      .toLowerCase();

  const isLocalhost =
    url.hostname === "127.0.0.1" ||
    url.hostname === "localhost";

  const email =
    authenticatedEmail ??
    (isLocalhost ? getLocalAdminEmail() : null);

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