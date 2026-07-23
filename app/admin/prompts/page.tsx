import Link from "next/link";
import { accessSignOutPath, requireAccessUser } from "../../cloudflare-access";
import { getAdminEmails } from "@/lib/server/runtime";
import { MASTER_BRAND_PHOTOGRAPHY_PROMPT } from "@/lib/brand-photography/master-prompt";
import PromptLibrary from "./PromptLibrary";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const user = await requireAccessUser();

  if (!getAdminEmails().has(user.email.toLowerCase())) {
    return (
      <main className="admin-denied">
        <h1>Access unavailable</h1>
        <p>This account cannot access the prompt library.</p>
      </main>
    );
  }

  return (
    <main>
      <nav
        aria-label="Prompt library navigation"
        style={{
          width: "min(1100px, calc(100% - 32px))",
          margin: "24px auto 0",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Link href="/admin">← Back to admin</Link>
        <a href={accessSignOutPath()}>Sign out</a>
      </nav>
      <PromptLibrary prompt={MASTER_BRAND_PHOTOGRAPHY_PROMPT} />
    </main>
  );
}
