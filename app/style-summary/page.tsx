"use client";
import { useEffect, useState } from "react";
import { StyleSummarySections } from "@/components/StyleSummarySections";
import type { RecapSummaryContent } from "@/lib/server/recap-policy";
import "./style-summary.css";
import "./style-summary-shell.css";

export default function StyleSummaryPage() { return <StyleSummaryClient />; }

export function StyleSummaryClient({ token }: { token?: string }) {
  const [content, setContent] = useState<RecapSummaryContent | null>(null), [loading, setLoading] = useState(Boolean(token)), [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/style-summary/${token}`, { cache: "no-store", referrerPolicy: "no-referrer" })
      .then(async response => {
        const payload = await response.json() as { data?: RecapSummaryContent; error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message || "This private link is unavailable.");
        return payload.data!;
      })
      .then(setContent)
      .catch(reason => setError(reason instanceof Error ? reason.message : "This private link is unavailable."))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <StandaloneShell><main className="style-summary-state"><h1>Private link required.</h1><p>Please use the Style Summary link shared with you by Kayla.</p></main></StandaloneShell>;
  if (loading) return <StandaloneShell><main className="style-summary-state"><p>Loading your Style Summary…</p></main></StandaloneShell>;
  if (!content) return <StandaloneShell><main className="style-summary-state"><h1>Link unavailable.</h1><p>{error}</p></main></StandaloneShell>;

  return <StandaloneShell><main className="style-summary-page"><StyleSummarySections content={content} /></main></StandaloneShell>;
}

function StandaloneShell({ children }: { children: React.ReactNode }) {
  return <div className="style-summary-standalone-shell">{children}</div>;
}
