import { dataResponse, withApi } from "@/lib/server/http";
import {
  PUBLIC_EVENT_FIELDS,
  publicEventJson,
} from "@/lib/server/public-events";
import { getD1 } from "@/lib/server/runtime";

export async function GET() {
  return withApi(async requestId => {
    const now = Date.now();
    const db = getD1();

    const rows = (
      await db
        .prepare(`
          SELECT
            ${PUBLIC_EVENT_FIELDS},
            e.capacity - COALESCE(
              (
                SELECT SUM(r.party_size)
                FROM event_rsvps r
                WHERE r.event_id = e.id
                  AND r.status='confirmed'
              ),
              0
            ) AS spotsRemaining
          FROM events e
          WHERE e.status='published'
            AND e.archived_at IS NULL
            AND e.ends_at>?
          ORDER BY e.starts_at
        `)
        .bind(now)
        .all<Record<string, unknown>>()
    ).results;

    return dataResponse(
      {
        events: rows.map(publicEventJson),
      },
      200,
      requestId,
    );
  });
}