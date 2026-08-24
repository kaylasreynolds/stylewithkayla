import Link from "next/link";
import type { RecapSummaryContent } from "@/lib/server/recap-policy";

const labels: Record<string, string> = { fit: "Fit", silhouette: "Silhouette", color: "Color", fabric: "Fabric", comfort: "Comfort", brand: "Brand", size: "Size", styling: "Styling", lifestyle: "Lifestyle", preference: "Preferences", other: "More We Learned" };
const details = (values: Array<string | null>) => values.filter(Boolean).join(" · ");

export function StyleSummarySections({ content }: { content: RecapSummaryContent }) {
  const groups = content.insights.reduce<Record<string, typeof content.insights>>((result, insight) => { (result[insight.category] ??= []).push(insight); return result; }, {});
  return <article className="style-summary">
    <header className="style-summary-hero">
      <p className="eyebrow">Your Style Summary</p>
      <span className="pink-rule" aria-hidden="true" />
      <h1>Curated for: {content.client.firstName}</h1>
      {content.client.appointmentDate && <p className="style-summary-meta"><span>{formatDate(content.client.appointmentDate)}</span><span className="style-summary-meta-dot" aria-hidden="true" /><span>{content.client.serviceName}</span></p>}
    </header>

    {content.whatWeSolved && <section><h2>What We Worked On</h2><p className="style-summary-lede">{content.whatWeSolved}</p></section>}
    {content.insights.length > 0 && <section><h2>What We Learned</h2><div className="style-summary-grid">{Object.entries(groups).map(([category, insights]) => <div className="style-summary-card" key={category}><h3>{labels[category] || category.replace(/_/g, " ")}</h3><ul>{insights.map((insight, index) => <li key={`${category}-${index}`}>{insight.insightText}</li>)}</ul></div>)}</div></section>}
    {content.formulas.length > 0 && <section><h2>Your Outfit Formulas</h2><ol className="style-summary-formulas">{content.formulas.map((formula, index) => <li key={index}><span className="style-summary-index" aria-hidden="true">{index + 1}</span><div><strong>{formula.formulaText}</strong>{formula.explanation && <p>{formula.explanation}</p>}</div></li>)}</ol></section>}
    {content.items.length > 0 && <section><h2>What We Added</h2><div className="style-summary-grid">{content.items.map((item, index) => <div className="style-summary-card" key={index}><h3>{item.itemName}</h3>{details([item.brand, item.color, item.size]) && <p className="style-summary-card-meta">{details([item.brand, item.color, item.size])}</p>}{item.note && <p>{item.note}</p>}</div>)}</div></section>}
    {content.priorities.length > 0 && <section><h2>Your Wardrobe Roadmap</h2><ol className="style-summary-roadmap">{content.priorities.map((priority, index) => <li key={index}><span className="style-summary-index" aria-hidden="true">{index + 1}</span><div>{priority.category && <small>{priority.category}</small>}<strong>{priority.priorityText}</strong></div></li>)}</ol></section>}
    {content.kaylaNote && <section className="style-summary-note"><span className="style-summary-quote" aria-hidden="true">&ldquo;</span><h2>A Note From Kayla</h2><p>{content.kaylaNote}</p></section>}
    {content.nextStylingMoment && <section><h2>Your Next Styling Moment</h2>{content.nextStylingMoment.serviceType && <h3>{content.nextStylingMoment.serviceType}</h3>}{content.nextStylingMoment.timing && <p className="style-summary-timing"><strong>When:</strong> {content.nextStylingMoment.timing}</p>}{content.nextStylingMoment.reason && <p>{content.nextStylingMoment.reason}</p>}{content.nextStylingMoment.bookingCtaEnabled && <Link className="button primary-button" href="/book">Book your next appointment</Link>}</section>}
    <footer className="style-summary-closing">
      <p>You have everything you need to keep building a wardrobe that feels like you.</p>
      <span className="pink-rule" aria-hidden="true" />
      <span className="style-summary-signature">Kayla</span>
    </footer>

  </article>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", { timeZone: "America/Boise", month: "long", day: "numeric", year: "numeric" }).format(date); }
