import { StyleSummarySections } from "@/components/StyleSummarySections";
import { ApiError } from "@/lib/server/http";
import { requireRecapSummaryAccess } from "@/lib/server/profile-access";
import type { RecapSummaryContent } from "@/lib/server/recap-policy";
import { getD1 } from "@/lib/server/runtime";
import { StandaloneShell } from "../page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await loadContent(token);
  if ("message" in result) return <StandaloneShell><main className="style-summary-state"><h1>Link unavailable.</h1><p>{result.message}</p></main></StandaloneShell>;
return (
  <StandaloneShell>
    <main className="style-summary-page">
      <div className="style-summary-logo">
        <img
          src="/images/stylewithkayla_hor.png"
          alt="Style with Kayla"
        />
      </div>

      <StyleSummarySections content={result.content} />
    </main>
  </StandaloneShell>
);
}

async function loadContent(token: string): Promise<{ content: RecapSummaryContent } | { message: string }> {
  try {
    const access = await requireRecapSummaryAccess(token);
    const row = await getD1().prepare(`SELECT content FROM recap_summaries WHERE id=?`).bind(access.recapSummaryId).first<{ content: string | RecapSummaryContent }>();
    if (!row) throw new ApiError(404, "STYLE_SUMMARY_NOT_FOUND", "This Style Summary is unavailable.");
    const content = typeof row.content === "string" ? JSON.parse(row.content) as RecapSummaryContent : row.content;
    return { content };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "This private link is unavailable.";
    return { message };
  }
}
