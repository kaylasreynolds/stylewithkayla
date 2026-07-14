import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";
import { getAdminEmails } from "@/lib/server/runtime";
import AdminPrivacy from "./AdminPrivacy";

export const dynamic = "force-dynamic";

export default async function AdminPrivacyPage(){
  const user=await requireChatGPTUser("/admin/privacy");
  if(!getAdminEmails().has(user.email.toLowerCase()))return <main className="admin-denied"><h1>Access unavailable</h1><p>This account cannot manage privacy operations.</p></main>;
  return <AdminPrivacy userName={user.displayName} signOutPath={chatGPTSignOutPath("/")}/>;
}

