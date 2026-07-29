export type EventSchedule = {
  eventDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  allDay?: unknown;
  startsAt?: unknown;
  timezone?: unknown;
};

const inputDatePattern = /^(\d{2})\/(\d{2})\/(\d{2})$/;
const pickerDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidEventDate(value: unknown) {
  const match = String(value ?? "").match(inputDatePattern);
  if (!match) return false;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = 2000 + Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

/** Returns a native date-input value only when the visible date is complete and valid. */
export function eventDateToPickerValue(value: unknown): string | null {
  const input = String(value ?? "");
  const match = input.match(inputDatePattern);
  if (!match || !isValidEventDate(input)) return null;
  return `20${match[3]}-${match[1]}-${match[2]}`;
}

/** Converts a native date-input value without using the browser's local time zone. */
export function pickerValueToEventDate(value: unknown): string | null {
  const input = String(value ?? "");
  const match = input.match(pickerDatePattern);
  if (!match || !match[1].startsWith("20")) return null;
  const visible = `${match[2]}/${match[3]}/${match[1].slice(2)}`;
  return isValidEventDate(visible) ? visible : null;
}

function longDate(event: EventSchedule) {
  const input = String(event.eventDate ?? "");
  const match = input.match(inputDatePattern);

  if (match && isValidEventDate(input)) {
    const date = new Date(Date.UTC(2000 + Number(match[3]), Number(match[1]) - 1, Number(match[2])));
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  return "Date not set";
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
