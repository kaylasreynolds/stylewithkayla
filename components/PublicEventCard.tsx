"use client";

import { publicEventView, type PublicEventPresentation } from "@/lib/event-presentation";

export function PublicEventCard({ event, previewImage }: { event: PublicEventPresentation; previewImage?: string }) {
  const view = publicEventView(event);
  const image = event.image as { url?: string; alt?: string; width?: number; height?: number } | null | undefined;
  const imageUrl = previewImage || image?.url || (event.imageAssetId ? `/api/events/assets/${String(event.imageAssetId)}` : "");
  const previewImageStyle = previewImage
    ? {
        height: "auto",
        minHeight: 0,
        aspectRatio: "4 / 3",
        objectFit: "contain" as const,
        alignSelf: "start",
        background: "#f7f1ed",
      }
    : undefined;

  return <article className="public-event-card">
    {imageUrl ? <img src={imageUrl} alt={String(event.imageAlt ?? image?.alt ?? "")} width={Number(event.imageWidth ?? image?.width) || undefined} height={Number(event.imageHeight ?? image?.height) || undefined} style={previewImageStyle}/> : <div className="public-event-card__placeholder" aria-hidden="true"/>}
    <div className="public-event-card__body">
      <p className="public-event-card__label">{view.label}</p>
      <time>{view.schedule}</time>
      <h2>{String(event.title || "Event title")}</h2>
      <p>{String(event.shortDescription || event.description || "Short event description")}</p>
      <dl><dt>Location</dt><dd>{String(event.location || "Location")}</dd><dt>Attendance</dt><dd>{view.attendance}</dd>{view.cost&&<><dt>Cost</dt><dd>{view.cost}</dd></>}{view.offer&&<><dt>Offer</dt><dd>{view.offer}</dd></>}</dl>
      {view.ctaVisible&&<EventCta event={event} label={view.ctaLabel}/>}
    </div>
  </article>;
}

function EventCta({ event, label }: { event: PublicEventPresentation; label: string }) {
  const action = String(event.ctaAction ?? "");
  const className = "event-button";

  if (action === "add_to_calendar") {
    if (!event.id) {
      // Unsaved draft (admin preview): no server record exists yet to build an .ics from.
      return <button type="button" className={className} disabled title="Save the event to enable the calendar download.">{label}</button>;
    }

    // Server-generated .ics with proper Content-Type/Content-Disposition headers.
    // A plain navigation link is far more reliable than a client-built Blob URL,
    // which many mobile/in-app browsers (Safari, Instagram/Facebook) block or mishandle.
    return <a className={className} href={`/api/events/${String(event.id)}/calendar`}>{label}</a>;
  }

  if (action === "external_url" && event.ctaUrl) {
    return <a className={className} href={String(event.ctaUrl)} target="_blank" rel="noopener noreferrer">{label}</a>;
  }

  if (action === "email" && event.ctaEmail) {
    return <a className={className} href={`mailto:${String(event.ctaEmail)}`}>{label}</a>;
  }

  if (action === "phone" && event.ctaPhone) {
    return <a className={className} href={`tel:${String(event.ctaPhone)}`}>{label}</a>;
  }

  // registration / appointment / interest_list / information: no public detail or
  // RSVP page exists yet to link to, so the CTA is shown but intentionally disabled
  // rather than rendered as a dead-click button.
  return <button type="button" className={className} disabled title="Registration isn't available on the public site yet.">{label}</button>;
}
