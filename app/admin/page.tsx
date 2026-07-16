import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { getAdminEmails } from "@/lib/server/runtime";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!getAdminEmails().has(user.email.toLowerCase())) return <main className="admin-denied"><h1>Access unavailable</h1><p>This account cannot manage appointment requests.</p></main>;
  return <AdminDashboard userName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
