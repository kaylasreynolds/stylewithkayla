export type EventSchedule = {
  eventDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  allDay?: unknown;
  startsAt?: unknown;
  timezone?: unknown;
};

const inputDatePattern = /^(\d{2})\/(\d{2})\/(\d{2})$/;

function longDate(event: EventSchedule) {
  const input = String(event.eventDate ?? "");
  const match = input.match(inputDatePattern);

  if (match) {
    const date = new Date(Date.UTC(2000 + Number(match[3]), Number(match[1]) - 1, Number(match[2])));
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  const instant = new Date(String(event.startsAt ?? ""));
  if (Number.isNaN(instant.valueOf())) return "Date not set";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: String(event.timezone || "America/Boise"),
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(instant);
}

/** Produces one stable schedule label for admin and public event cards. */
export function formatEventSchedule(event: EventSchedule) {
  const date = longDate(event);
  if (Boolean(event.allDay)) return `${date} · All day`;

  const start = String(event.startTime ?? "").trim();
  const end = String(event.endTime ?? "").trim();
  if (start && end) return `${date} · ${start}–${end}`;
  if (start) return `${date} · ${start}`;
  return date;
}
