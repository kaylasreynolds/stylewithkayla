import { headers } from "next/headers";
import { getAuthenticatedAdminEmail } from "@/lib/server/access-identity";

export type AccessUser = {
  displayName: string;
  email: string;
};

export async function getAccessUser(): Promise<AccessUser | null> {
  const requestHeaders = await headers();
  const email = getAuthenticatedAdminEmail(requestHeaders);

  if (!email) {
    return null;
  }

  return {
    displayName: email.split("@")[0] || email,
    email,
  };
}

export async function requireAccessUser(): Promise<AccessUser> {
  const user = await getAccessUser();

  if (!user) {
    throw new Error(
      "Authentication required. Protect this route with Cloudflare Access.",
    );
  }

  return user;
}

export function accessSignOutPath(): string {
  return "/cdn-cgi/access/logout";
}
