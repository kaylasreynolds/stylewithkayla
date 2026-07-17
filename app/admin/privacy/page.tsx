import {
  accessSignOutPath,
  requireAccessUser,
} from "../../cloudflare-access";
import { getAdminEmails } from "@/lib/server/runtime";
import AdminPrivacy from "./AdminPrivacy";

export const dynamic = "force-dynamic";

export default async function AdminPrivacyPage() {
  const user = await requireAccessUser();

  if (!getAdminEmails().has(user.email.toLowerCase())) {
    return (
      <main className="admin-denied">
        <h1>Access unavailable</h1>
        <p>This account cannot manage privacy operations.</p>
      </main>
    );
  }

  return (
    <AdminPrivacy
      userName={user.displayName}
      signOutPath={accessSignOutPath()}
    />
  );
}