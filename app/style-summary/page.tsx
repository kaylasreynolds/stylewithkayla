"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StyleSummarySections } from "@/components/StyleSummarySections";
import type { RecapSummaryContent } from "@/lib/server/recap-policy";
import "./style-summary.css";

export default function StyleSummaryPage() { return <StyleSummaryClient />; }
export function StyleSummaryClient({ token }: { token?: string }) {
  const [content, setContent] = useState<RecapSummaryContent | null>(null), [loading, setLoading] = useState(Boolean(token)), [error, setError] = useState("");
  useEffect(() => { if (!token) return; fetch(`/api/style-summary/${token}`, { cache: "no-store", referrerPolicy: "no-referrer" }).then(async response => { const payload = await response.json() as { data?: RecapSummaryContent; error?: { message?: string } }; if (!response.ok) throw new Error(payload.error?.message || "This private link is unavailable."); return payload.data!; }).then(setContent).catch(reason => setError(reason instanceof Error ? reason.message : "This private link is unavailable.")).finally(() => setLoading(false)); }, [token]);
  if (!token) return <Shell><main className="style-summary-state"><h1>Private link required.</h1><p>Please use the Style Summary link shared with you by Kayla.</p></main></Shell>;
  if (loading) return <Shell><main className="style-summary-state"><p>Loading your Style Summary…</p></main></Shell>;
  if (!content) return <Shell><main className="style-summary-state"><h1>Link unavailable.</h1><p>{error}</p></main></Shell>;
  return <Shell><main className="style-summary-page"><StyleSummarySections content={content} /></main></Shell>;
}
function Shell({children}:{children:React.ReactNode}){return <div className="site-shell"><Announcement/><Header/>{children}<Footer/></div>};function Announcement(){return <div className="announcement-bar">Complimentary Personal Styling Appointments | 20% Off For First Time Clients*</div>};function Header(){return <header className="site-header"><div className="container header-inner"><Link className="site-logo" href="/" aria-label="Style with Kayla home"><Image src="/images/stylewithkayla_logo.png" alt="Style with Kayla" width={3266} height={1241} priority/></Link><nav className="site-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#services">Services</Link><Link href="/#events">Events</Link><Link href="/#about">About Me</Link><a href="#contact">Contact</a></nav><Link className="button header-cta" href="/">BOOK APPOINTMENT</Link></div></header>};function Footer(){return <footer className="site-footer" id="contact"><div className="container footer-inner"><div className="footer-column footer-brand"><Link className="footer-logo" href="/"><Image src="/images/stylewithkayla_logo.png" alt="Style with Kayla" width={3266} height={1241} loading="eager"/></Link></div><nav className="footer-column footer-links"><p className="footer-kicker">Quick Links</p><Link href="/#services">Services</Link><Link href="/#events">Events</Link><Link href="/#about">About Me</Link></nav><div className="footer-column footer-contact"><p className="footer-kicker">Let&apos;s Connect</p><a href="tel:+12088596427">208-859-6427</a><a href="mailto:kayla.reynolds@macys.com">kayla.reynolds@macys.com</a><p>Macy&apos;s Boise Towne Square<br/>370 N. Milwaukee St.<br/>Boise, ID 83704</p></div></div><div className="container footer-bottom"><span>© 2026 Style with Kayla</span><span>|</span><span>Personal Stylist at Macy&apos;s</span></div></footer>}
