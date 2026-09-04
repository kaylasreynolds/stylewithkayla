import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getD1 } from "@/lib/server/runtime";
import {
  PUBLIC_EVENT_FIELDS,
  publicEventJson,
} from "@/lib/server/public-events";
import { attendanceText } from "@/lib/event-presentation";
import EventPageActions from "./EventPageActions";
import styles from "./event-page.module.css";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ slug: string }>;
};

const dateFormat = (
  event: Record<string, unknown>,
) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: String(event.timezone),
  }).format(
    new Date(String(event.startsAt)),
  );

const timeFormat = (
  event: Record<string, unknown>,
) =>
  event.allDay
    ? "All day"
    : `${new Intl.DateTimeFormat(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          timeZone: String(
            event.timezone,
          ),
        },
      ).format(
        new Date(
          String(event.startsAt),
        ),
      )}–${new Intl.DateTimeFormat(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          timeZone: String(
            event.timezone,
          ),
        },
      ).format(
        new Date(
          String(event.endsAt),
        ),
      )}`;

export default async function EventPage({
  params,
}: Context) {
  const { slug } = await params;

  const row = await getD1()
    .prepare(
      `SELECT ${PUBLIC_EVENT_FIELDS},
        unixepoch()*1000 AS currentTime,
        CASE
          WHEN e.unlimited_capacity=1 THEN 999999
          ELSE e.capacity-COALESCE(
            (
              SELECT SUM(r.party_size)
              FROM event_rsvps r
              WHERE r.event_id=e.id
                AND r.status='confirmed'
            ),
            0
          )
        END AS spotsRemaining
       FROM events e
       WHERE e.slug=?
         AND e.status='published'
         AND e.archived_at IS NULL
       LIMIT 1`,
    )
    .bind(slug)
    .first<Record<string, unknown>>();

  if (!row) notFound();

  const {
    currentTime,
    ...publicRow
  } = row;

  const event =
    publicEventJson(
      publicRow,
    ) as Record<string, unknown>;  

  const isPast =
    Number(row.endsAt) <=
    Number(currentTime);

  const details = [
    ["Date", dateFormat(event)],
    ["Time", timeFormat(event)],
    [
      "Location",
      [
        event.location,
        event.locationDetails,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      "Attendance Type",
      attendanceText(
        String(
          event.attendanceType,
        ),
      ),
    ],
    ["Cost", event.costLabel],
  ].filter(([, value]) => value);

  return (
    <main className={styles.page}>
      <header
        className={styles.header}
      >
        <Link href="/events">
          ← Back to Events
        </Link>

        <img
  src="/images/stylewithkayla_logo.png"
  alt="Style with Kayla"
  width="180"
  height="68"
/>

        <span aria-hidden="true" />
      </header>

      <article
        className={styles.content}
      >
        <section
          className={styles.hero}
        >
          <p>
            {isPast
              ? "EVENT"
              : "UPCOMING EVENT"}
          </p>

          <h1>
            {String(event.title)}
          </h1>

          <strong>
            {dateFormat(event)}
          </strong>

          <span>
            {timeFormat(event)}
          </span>

          <span>
            {String(event.location)}
          </span>
        </section>

        {Boolean(event.imageUrl) && (
          <div
            className={styles.image}
          >
            <Image
              src={String(
                event.imageUrl,
              )}
              alt={String(
                event.imageAlt ||
                  "",
              )}
              width={
                Number(
                  event.imageWidth,
                ) || 1200
              }
              height={
                Number(
                  event.imageHeight,
                ) || 900
              }
              sizes="(max-width: 720px) 100vw, 680px"
              unoptimized
              priority
            />
          </div>
        )}

        <dl
          className={styles.details}
        >
          {details.map(
            ([label, value]) => (
              <div
                key={String(label)}
              >
                <dt>
                  {String(label)}
                </dt>

                <dd>
                  {String(value)}
                </dd>
              </div>
            ),
          )}
        </dl>

        {Boolean(event.description) && (
          <section
            className={styles.about}
          >
            <h2>
              About This Event
            </h2>

            {String(
              event.description,
            )
              .split(/\n\s*\n/)
              .map(
                (
                  paragraph,
                  index,
                ) => (
                  <p key={index}>
                    {paragraph}
                  </p>
                ),
              )}
          </section>
        )}

        {Boolean(event.offer) && (
          <aside
            className={styles.offer}
          >
            <p>SHOW SPECIAL</p>

            <h2>
              {String(event.offer)}
            </h2>

            {Boolean(event.offerDetails) && (
              <div>
                {String(
                  event.offerDetails,
                )}
              </div>
            )}

            {Boolean(event.offerTerms) && (
              <small>
                {String(
                  event.offerTerms,
                )}
              </small>
            )}
          </aside>
        )}

        <EventPageActions
          event={event}
          isPast={isPast}
          currentTime={Number(
            currentTime,
          )}
        />
      </article>
    </main>
  );
}