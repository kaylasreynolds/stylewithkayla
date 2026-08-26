import Link from "next/link";
import type { RecapSummaryContent } from "@/lib/server/recap-policy";

const labels: Record<string, string> = {
  fit: "Fit",
  silhouette: "Silhouette",
  color: "Color",
  fabric: "Fabric",
  comfort: "Comfort",
  brand: "Brand",
  size: "Size",
  styling: "Styling",
  lifestyle: "Lifestyle",
  preference: "Preferences",
  other: "More We Learned",
};

const insightIcons: Record<string, string> = {
  fit: "/images/slim-fit.png",
  silhouette: "/images/dressing.png",
  color: "/images/pantone.png",
  fabric: "/images/fabric.png",
  comfort: "/images/soft.png",
  brand: "/images/best-product.png",
  size: "/images/measurement.png",
  styling: "/images/effect.png",
  lifestyle: "/images/healthy.png",
  preference: "/images/choose.png",
  other: "/images/circle-variant.png",
};

const details = (values: Array<string | null>) =>
  values.filter(Boolean).join(" · ");

function DecorativeIcon({ src }: { src: string }) {
  return (
    <span className="style-summary-icon" aria-hidden="true">
      {/* Static approved brand assets are intentionally used directly here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={52} height={52} />
    </span>
  );
}

export function StyleSummarySections({ content }: { content: RecapSummaryContent }) {
  const complimentaryInsights = content.insights.filter(insight => insight.polarity === "worked");
  const lessFlatteringInsights = content.insights.filter(insight => insight.polarity === "didnt_work");

  return (
    <article className="style-summary">
      <header className="style-summary-hero">
        <p className="style-summary-eyebrow">Your Style Summary</p>
        <h1>Curated for: {content.client.firstName}</h1>
        <span className="style-summary-ornament" aria-hidden="true">
          <i />✦<i />
        </span>
        {content.client.appointmentDate && (
          <p className="style-summary-meta">
            <span>{formatDate(content.client.appointmentDate)}</span>
            <span className="style-summary-meta-dot" aria-hidden="true" />
            <span>{content.client.serviceName}</span>
          </p>
        )}
      </header>

      {content.whatWeSolved && (
  <section className="style-summary-section style-summary-worked-on">
    <h2>What We Accomplished Today</h2>

    <div className="style-summary-worked-on-card">
      <DecorativeIcon src="/images/womens-event.png" />

      <strong>{content.whatWeSolved}</strong>
    </div>
  </section>
)}

      {content.insights.length > 0 && (
        <section className="style-summary-section style-summary-learned">
          <h2>What We Learned</h2>
          <div className="style-summary-insight-grid">
            <InsightCard title="Compliments You" tone="complimentary" insights={complimentaryInsights} />
            <InsightCard title="Less Flattering" tone="less-flattering" insights={lessFlatteringInsights} />
          </div>
        </section>
      )}

      {content.formulas.length > 0 && (
        <section className="style-summary-section style-summary-formula-section">
          <h2>Your Outfit Formulas</h2>
          <ol className="style-summary-formulas">
            {content.formulas.map((formula, index) => (
              <li key={index}>
                <span className="style-summary-index" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <strong>{formula.formulaText}</strong>
                  {formula.explanation && <p>{formula.explanation}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {content.items.length > 0 && (
        <section className="style-summary-section style-summary-added">
          <h2>What We Added</h2>
          <ul className="style-summary-item-list">
            {content.items.map((item, index) => (
              <li className="style-summary-item-card" key={index}>
                <span className="style-summary-item-bullet" aria-hidden="true">·</span>
                <div>
                  <h3>{item.itemName}</h3>
                  {details([item.brand, item.color, item.size]) && (
                    <p className="style-summary-card-meta">
                      {details([item.brand, item.color, item.size])}
                    </p>
                  )}
                  {item.note && <p className="style-summary-item-note">{item.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.priorities.length > 0 && (
        <section className="style-summary-section style-summary-roadmap-section">
          <h2>Next Priorities</h2>
          <ol className="style-summary-roadmap">
            {content.priorities.map((priority, index) => (
              <li key={index}>
                <span className="style-summary-roadmap-marker" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  {priority.category && <small>{priority.category}</small>}
                  <strong>{priority.priorityText}</strong>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {content.kaylaNote && (
        <section className="style-summary-note">
          <span className="style-summary-quote" aria-hidden="true">
            “
          </span>
          <div>
            <h2>A Note From Kayla</h2>
            <p>{content.kaylaNote}</p>
          </div>
          <span className="style-summary-quote style-summary-quote--closing" aria-hidden="true">
            ”
          </span>
        </section>
      )}

      {content.nextStylingMoment && (
        <section className="style-summary-section style-summary-next">
          <h2>Your Next Styling Moment</h2>
          <div
            className="style-summary-next-card"
            style={{ minHeight: "150px", padding: "24px 22px" }}
          >
            <DecorativeIcon src="/images/store-event.png" />
            <div className="style-summary-next-copy">
              <small>Recommended next</small>
              <h3
                style={{
                  margin: "2px 0 6px",
                  fontSize: "clamp(30px, 4.5vw, 38px)",
                  lineHeight: 1.05,
                }}
              >
                Seasonal Refresh
              </h3>
              <p>Update closet for fall</p>
            </div>
            <div className="style-summary-next-action">
              <p className="style-summary-timing">Suggested booking date: October 2026</p>
              {content.nextStylingMoment.bookingCtaEnabled && (
                <Link className="style-summary-booking-link" href="/book">
                  Book Your Next Appointment
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="style-summary-closing">
        <p>See you soon,</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="style-summary-signature"
          src="/images/kayla-bl.png"
          alt="Kayla"
          width={405}
          height={139}
        />
      </footer>
    </article>
  );
}

function InsightCard({ title, tone, insights }: { title: string; tone: string; insights: RecapSummaryContent["insights"] }) {
  return (
    <div className={`style-summary-insight-card style-summary-insight-card--${tone}`}>
      <h3>{title}</h3>
      <ul>
        {insights.map((insight, index) => (
          <li key={`${insight.category}-${index}`}>
            <DecorativeIcon src={insightIcons[insight.category] || insightIcons.other} />
            <p><strong>{labels[insight.category] || insight.category.replace(/_/g, " ")}</strong><span aria-hidden="true"> – </span>{insight.insightText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Boise",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date);
}
