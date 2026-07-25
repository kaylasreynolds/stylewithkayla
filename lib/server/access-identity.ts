import { resolveAccessEmail } from "@/lib/access-identity";
import { getLocalAdminEmail } from "@/lib/server/runtime";

export function getAuthenticatedAdminEmail(
  requestHeaders: Headers,
): string | null {
  return resolveAccessEmail(requestHeaders, {
    // Vite replaces this with `false` in production builds. Merely defining
    // LOCAL_ADMIN_EMAIL in a deployed environment cannot enable the fallback.
    allowLocalFallback: import.meta.env.DEV,
    localAdminEmail: import.meta.env.DEV ? getLocalAdminEmail() : null,
  });
}
