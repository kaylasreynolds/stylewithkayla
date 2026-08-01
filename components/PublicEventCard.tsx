"use client";

import { publicEventView, type PublicEventPresentation } from "@/lib/event-presentation";

function calendarEscape(value: unknown) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function calendarDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function safeCalendarFilename(title: unknown) {
  const filename = String(title || "event")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .trim();
  return `${filename || "event"}.ics`;
}

function downloadCalendar(event: PublicEventPresentation) {
  const startsAt = calendarDate(event.startsAt);
  const endsAt = calendarDate(event.endsAt);
  if (!startsAt || !endsAt) return;

  const description = event.description || event.shortDescription || "";
  const location = [event.location, event.locationDetails].filter(Boolean).join(", ");
  const uid = `${String(event.id || crypto.randomUUID())}@stylewithkayla.com`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//Style with Kayla//Events//EN",
    "BEGIN:VEVENT",
    `UID:${calendarEscape(uid)}`,
    `DTSTAMP:${calendarDate(new Date().toISOString())}`,
    `DTSTART:${startsAt}`,
    `DTEND:${endsAt}`,
    `SUMMARY:${calendarEscape(event.title)}`,
    `DESCRIPTION:${calendarEscape(description)}`,
    `LOCATION:${calendarEscape(location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeCalendarFilename(event.title);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PublicEventCard({ event, previewImage }: { event: PublicEventPresentation; previewImage?: string }) {
  const view = publicEventView(event);
  const image = event.image as { url?: string; alt?: string; width?: number; height?: number } | null | undefined;
  const imageUrl = previewImage || image?.url || (event.imageAssetId ? `/api/events/assets/${String(event.imageAssetId)}` : "");
  const isCalendarAction = String(event.ctaAction ?? "") === "add_to_calendar";
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
    <div>
      <p className="public-event-card__label">{view.label}</p>
      <time>{view.schedule}</time>
      <h2>{String(event.title || "Event title")}</h2>
      <p>{String(event.shortDescription || event.description || "Short event description")}</p>
      <dl><dt>Location</dt><dd>{String(event.location || "Location")}</dd><dt>Attendance</dt><dd>{view.attendance}</dd>{view.cost&&<><dt>Cost</dt><dd>{view.cost}</dd></>}{view.offer&&<><dt>Offer</dt><dd>{view.offer}</dd></>}</dl>
      {view.ctaVisible&&<button type="button" className="event-button" onClick={isCalendarAction ? () => downloadCalendar(event) : undefined}>{view.ctaLabel}</button>}
    </div>
  </article>;
}
