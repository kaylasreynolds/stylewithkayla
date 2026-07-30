import { publicEventJson } from "@/lib/server/event-management";
import { getD1 } from "@/lib/server/runtime";
import { PublicEventCard } from "@/components/PublicEventCard";
import { PUBLIC_EVENT_FIELDS } from "@/lib/server/public-events";
export const dynamic="force-dynamic";
export default async function Events(){const rows=(await getD1().prepare(`SELECT ${PUBLIC_EVENT_FIELDS} FROM events e WHERE e.status='published' AND e.ends_at>=unixepoch()*1000 ORDER BY e.starts_at LIMIT 100`).all<Record<string,unknown>>()).results,events=rows.map(publicEventJson);return <main className="public-events"><header><p>STYLE WITH KAYLA</p><h1>Upcoming Events</h1></header><section aria-label="Upcoming events">{events.map(e=><PublicEventCard event={e} key={String(e.id)}/>)}{!events.length&&<p>No upcoming events are currently scheduled.</p>}</section></main>}
