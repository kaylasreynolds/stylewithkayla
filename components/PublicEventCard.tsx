import { publicEventView, type PublicEventPresentation } from "@/lib/event-presentation";

export function PublicEventCard({ event, previewImage }: { event: PublicEventPresentation; previewImage?: string }) {
  const view = publicEventView(event);
  const image = event.image as { url?: string; alt?: string; width?: number; height?: number } | null | undefined;
  const imageUrl = previewImage || image?.url || (event.imageAssetId ? `/api/events/assets/${String(event.imageAssetId)}` : "");
  return <article className="public-event-card">
    {imageUrl ? <img src={imageUrl} alt={String(event.imageAlt ?? image?.alt ?? "")} width={Number(event.imageWidth ?? image?.width) || undefined} height={Number(event.imageHeight ?? image?.height) || undefined}/> : <div className="public-event-card__placeholder" aria-hidden="true"/>}
    <div>
      <p className="public-event-card__label">{view.label}</p>
      <time>{view.schedule}</time>
      <h2>{String(event.title || "Event title")}</h2>
      <p>{String(event.shortDescription || event.description || "Short event description")}</p>
      <dl><dt>Location</dt><dd>{String(event.location || "Location")}</dd><dt>Attendance</dt><dd>{view.attendance}</dd>{view.cost&&<><dt>Cost</dt><dd>{view.cost}</dd></>}{view.offer&&<><dt>Offer</dt><dd>{view.offer}</dd></>}</dl>
      {view.ctaVisible&&<button type="button" className="event-button">{view.ctaLabel}</button>}
    </div>
  </article>;
}
