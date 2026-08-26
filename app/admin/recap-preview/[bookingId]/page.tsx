import { getAdminEmails } from "@/lib/server/runtime";
import { accessSignOutPath, requireAccessUser } from "../../../cloudflare-access";
import RecapPreview from "./RecapPreview";
import "../../../style-summary/style-summary.css";
import "../../../style-summary/style-summary-shell.css";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const user = await requireAccessUser(), { bookingId } = await params;
  if (!getAdminEmails().has(user.email.toLowerCase())) return <main className="admin-denied"><h1>Access unavailable</h1><p>This account cannot access the Style Summary preview.</p></main>;
  return <RecapPreview bookingId={bookingId} userName={user.displayName} signOutPath={accessSignOutPath()} />;
}
