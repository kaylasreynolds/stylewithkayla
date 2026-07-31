import { requireAdmin } from "@/lib/server/admin-auth";
import {
  EVENT_KEYS,
  eventJson,
  validateEventForPublish,
} from "@/lib/server/event-management";
import {
  ApiError,
  dataResponse,
  readJsonObject,
  rejectUnexpectedKeys,
  withApi,
} from "@/lib/server/http";
import { getD1 } from "@/lib/server/runtime";

function editableEventFromStoredEvent(
  event: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    EVENT_KEYS
      .filter((key) => Object.hasOwn(event, key))
      .map((key) => [key, event[key]]),
  );
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ eventId: string }>;
  },
) {
  return withApi(async (requestId) => {
    requireAdmin(request);

    rejectUnexpectedKeys(
      await readJsonObject(request),
      [],
    );

    const eventId = (await params).eventId;

    const row = await getD1()
      .prepare(
        "SELECT * FROM events WHERE id=?",
      )
      .bind(eventId)
      .first<Record<string, unknown>>();

    if (!row) {
      throw new ApiError(
        404,
        "EVENT_NOT_FOUND",
        "Event not found.",
      );
    }

    if (row.status !== "draft") {
      throw new ApiError(
        409,
        "INVALID_EVENT_TRANSITION",
        "Only draft events can be published.",
      );
    }

    const storedEvent = eventJson(row);

    validateEventForPublish(
      editableEventFromStoredEvent(storedEvent),
    );

    const now = Date.now();

    await getD1()
      .prepare(
        "UPDATE events SET status='published',published_at=?,updated_at=? WHERE id=?",
      )
      .bind(
        now,
        now,
        eventId,
      )
      .run();

    return dataResponse(
      {
        eventId,
        status: "published",
        publishedAt: new Date(now).toISOString(),
      },
      200,
      requestId,
    );
  });
}