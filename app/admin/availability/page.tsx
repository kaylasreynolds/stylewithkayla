import { accessSignOutPath, requireAccessUser } from "../../cloudflare-access";
import { getAdminEmails } from "@/lib/server/runtime";
import AdminAvailability from "./AdminAvailability";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const user = await requireAccessUser();

  if (!getAdminEmails().has(user.email.toLowerCase())) {
    return (
      <main className="admin-denied">
        <h1>Access unavailable</h1>
      </main>
    );
  }

  return (
    <AdminAvailability
      userName={user.displayName}
      signOutPath={accessSignOutPath()}
    />
  );
}