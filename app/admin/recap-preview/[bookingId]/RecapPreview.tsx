"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StyleSummarySections } from "@/components/StyleSummarySections";
import type { RecapSummaryContent } from "@/lib/server/recap-policy";

export default function RecapPreview({ bookingId, userName, signOutPath }: { bookingId: string; userName: string; signOutPath: string }) {
  const [content, setContent] = useState<RecapSummaryContent | null>(null), [error, setError] = useState(""), [publishing, setPublishing] = useState(false), [link, setLink] = useState("");
  useEffect(() => { fetch(`/api/admin/bookings/${bookingId}/recap/preview`, { cache: "no-store" }).then(async response => { const payload = await response.json() as { data?: RecapSummaryContent; error?: { message?: string } }; if (!response.ok) throw new Error(payload.error?.message || "The preview could not be loaded."); setContent(payload.data!); }).catch(reason => setError(reason instanceof Error ? reason.message : "The preview could not be loaded.")); }, [bookingId]);
  async function publish() { setPublishing(true); setError(""); try { const response = await fetch(`/api/admin/bookings/${bookingId}/recap/publish`, { method: "POST" }); const payload = await response.json() as { data?: { styleSummaryUrl: string }; error?: { message?: string } }; if (!response.ok) throw new Error(payload.error?.message || "The Style Summary could not be published."); setLink(payload.data!.styleSummaryUrl); } catch (reason) { setError(reason instanceof Error ? reason.message : "The Style Summary could not be published."); } finally { setPublishing(false); } }
  return <main className="recap-preview-admin"><header className="admin-header"><div><p className="eyebrow">STYLE SUMMARY PREVIEW</p><h1>Review the client view</h1><p>Signed in as {userName}</p></div><div><Link href="/admin">Back to appointments</Link> · <a href={signOutPath}>Sign out</a></div></header>
    <div className="recap-preview-actions"><button className="primary-button" disabled={publishing || !content || Boolean(link)} onClick={() => void publish()}>{publishing ? "Publishing…" : "Publish Style Summary"}</button>{error && <p role="alert">{error}</p>}{link && <div className="profile-link-result"><strong>Private Style Summary link</strong><p>This private link is shown only now. Copy it for the client.</p><input readOnly value={link}/><button onClick={() => void navigator.clipboard.writeText(link)}>Copy link</button></div>}</div>
    {content ? <div className="style-summary-page"><StyleSummarySections content={content}/></div> : !error && <p>Loading preview…</p>}
  </main>;
}
