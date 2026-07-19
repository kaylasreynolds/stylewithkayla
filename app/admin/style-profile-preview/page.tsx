import { getAdminEmails } from "@/lib/server/runtime";
import { PROFILE_SCHEMAS } from "@/lib/server/profile-policy";
import { accessSignOutPath, requireAccessUser } from "../../cloudflare-access";
import StyleProfilePreview from "./StyleProfilePreview";

export const dynamic = "force-dynamic";

export default async function StyleProfilePreviewPage() {
  const user = await requireAccessUser();

  if (!getAdminEmails().has(user.email.toLowerCase())) {
    return (
      <main className="admin-denied">
        <h1>Access unavailable</h1>
        <p>This account cannot access the Style Profile preview.</p>
      </main>
    );
  }

  return (
    <StyleProfilePreview
      schemas={PROFILE_SCHEMAS}
      userName={user.displayName}
      signOutPath={accessSignOutPath()}
    />
  );
}
