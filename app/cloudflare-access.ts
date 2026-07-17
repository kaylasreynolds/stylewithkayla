import { headers } from "next/headers";

export type AccessUser = {
  displayName: string;
  email: string;
};

const ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";

export async function getAccessUser(): Promise<AccessUser | null> {
  const requestHeaders = await headers();
  const email = requestHeaders
    .get(ACCESS_EMAIL_HEADER)
    ?.trim()
    .toLowerCase();

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