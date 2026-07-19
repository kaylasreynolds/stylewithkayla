import Link from "next/link";
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
    <>
      <div className="admin-preview-shortcut">
        <Link href="/admin/style-profile-preview">
          Open live Style Profile preview
        </Link>
        <span>Review every profile route, test answers, and reset the form without changing client data.</span>
      </div>
      <AdminDashboard
        userName={user.displayName}
        signOutPath={accessSignOutPath()}
      />
    </>
  );
}
