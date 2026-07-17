import AdminDashboard from "./AdminDashboard";
import {
  accessSignOutPath,
  requireAccessUser,
} from "../cloudflare-access";
import { getAdminEmails } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAccessUser();

  if (!getAdminEmails().has(user.email.toLowerCase())) {
    return (
      <main className="admin-denied">
        <h1>Access unavailable</h1>
        <p>This account cannot manage appointment requests.</p>
      </main>
    );
  }

  return (
    <AdminDashboard
      userName={user.displayName}
      signOutPath={accessSignOutPath()}
    />
  );
}