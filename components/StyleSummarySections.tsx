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
  fit: "/images/hanger-pink.png",
  silhouette: "/images/womens-styling.png",
  color: "/images/kayla-swatches.png",
  fabric: "/images/finishing-touches.png",
  comfort: "/images/heart-pink.png",
  brand: "/images/shopping-bag.svg",
  size: "/images/what-to-expect.png",
  styling: "/images/stars.png",
  lifestyle: "/images/womens-everyday.png",
  preference: "/images/heart-pink.png",
  other: "/images/stars.png",
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
  const groups = content.insights.reduce<Record<string, typeof content.insights>>(
    (result, insight) => {
      (result[insight.category] ??= []).push(insight);
      return result;
    },
    {},
  );

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
    <h2>What We Worked On</h2>

    <div className="style-summary-worked-on-card">
      <DecorativeIcon src="/images/womens-event.png" />

      <strong>{content.whatWeSolved}</strong>
    </div>
  </section>
)}

      {content.insights.length > 0 && (
        <section className="style-summary-section style-summary-learned">
          <h2>What We Learned</h2>
          <div className="style-summary-insight-list">
            {Object.entries(groups).map(([category, insights]) => (
              <div className="style-summary-insight-card" key={category}>
                <DecorativeIcon src={insightIcons[category] || insightIcons.other} />
                <div>
                  <h3>{labels[category] || category.replace(/_/g, " ")}</h3>
                  <ul>
                    {insights.map((insight, index) => (
                      <li key={`${category}-${index}`}>{insight.insightText}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
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
          <div className="style-summary-item-list">
            {content.items.map((item, index) => (
              <div className="style-summary-item-card" key={index}>
                <h3>{item.itemName}</h3>
                {details([item.brand, item.color, item.size]) && (
                  <p className="style-summary-card-meta">
                    {details([item.brand, item.color, item.size])}
                  </p>
                )}
                {item.note && <p className="style-summary-item-note">{item.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.priorities.length > 0 && (
        <section className="style-summary-section style-summary-roadmap-section">
          <h2>Your Wardrobe Roadmap</h2>
          <ol className="style-summary-roadmap">
            {content.priorities.map((priority, index) => (
              <li key={index}>
                <span className="style-summary-roadmap-marker" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/location.png" alt="" width={34} height={34} />
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
        </section>
      )}

      {content.nextStylingMoment && (
        <section className="style-summary-section style-summary-next">
          <h2>Your Next Styling Moment</h2>
          <div className="style-summary-next-card">
            <DecorativeIcon src="/images/store-event.png" />
            <div className="style-summary-next-copy">
              <small>Recommended next</small>
              {content.nextStylingMoment.serviceType && (
                <h3>{content.nextStylingMoment.serviceType}</h3>
              )}
              {content.nextStylingMoment.timing && (
                <p className="style-summary-timing">
                  <strong>Recommended:</strong> {content.nextStylingMoment.timing}
                </p>
              )}
              {content.nextStylingMoment.reason && (
                <p>{content.nextStylingMoment.reason}</p>
              )}
            </div>
            {content.nextStylingMoment.bookingCtaEnabled && (
              <Link className="style-summary-booking-link" href="/book">
                Book your next appointment
              </Link>
            )}
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
