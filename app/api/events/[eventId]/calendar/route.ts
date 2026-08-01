import { getD1 } from "@/lib/server/runtime";

type Context = { params: Promise<{ eventId: string }> };

type EventCalendarRow = {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  location: string | null;
  locationDetails: string | null;
  startsAt: number;
  endsAt: number;
};

export async function GET(_request: Request, ctx: Context) {
  try {
    const { eventId } = await ctx.params;
    const db = getD1();

    const row = await db
      .prepare(`
        SELECT
          e.id,
          e.title,
          e.description,
          e.short_description AS shortDescription,
          e.location,
          e.location_details AS locationDetails,
          e.starts_at AS startsAt,
          e.ends_at AS endsAt
        FROM events e
        WHERE e.id = ?
          AND e.status = 'published'
          AND e.archived_at IS NULL
      `)
      .bind(eventId)
      .first<EventCalendarRow>();

    if (!row) {
      return new Response("Calendar file unavailable.", {
        status: 404,
        headers: privateHeaders(),
      });
    }

    const description = row.description || row.shortDescription || "";
    const location = [row.location, row.locationDetails].filter(Boolean).join(", ");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Style With Kayla//Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${escapeIcs(`${row.id}@stylewithkayla.com`)}`,
      `DTSTAMP:${icsDate(Date.now())}`,
      `DTSTART:${icsDate(row.startsAt)}`,
      `DTEND:${icsDate(row.endsAt)}`,
      `SUMMARY:${escapeIcs(row.title)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs(location)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");

    return new Response(ics, {
      status: 200,
      headers: {
        ...privateHeaders(),
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeFilename(row.title)}"`,
      },
    });
  } catch {
    return new Response("Calendar file unavailable.", {
      status: 404,
      headers: privateHeaders(),
    });
  }
}

function icsDate(value: number) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function safeFilename(title: string) {
  const filename = String(title || "event")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .trim();
  return `${filename || "event"}.ics`;
}

function privateHeaders() {
  return {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}
