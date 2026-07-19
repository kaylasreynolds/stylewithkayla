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
      <div
        style={{
          width: "min(1240px, calc(100% - 48px))",
          margin: "28px auto -20px",
          padding: "16px 18px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px 20px",
          border: "1px solid var(--rose)",
          borderRadius: "6px",
          background: "var(--blush)",
        }}
      >
        <Link
          href="/admin/style-profile-preview"
          style={{ color: "var(--rose-dark)", fontWeight: 700 }}
        >
          Open live Style Profile preview →
        </Link>
        <span style={{ color: "var(--charcoal)", fontSize: "12px" }}>
          Review every profile route, test answers, and reset the form without changing client data.
        </span>
      </div>
      <AdminDashboard
        userName={user.displayName}
        signOutPath={accessSignOutPath()}
      />
    </>
  );
}
