"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildEventPayload } from "@/lib/event-editor-client";
import styles from "./EventOverviewPanel.module.css";

type EventData = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  location: string;
  locationDetails?: string | null;
  capacity: number | null;
  unlimitedCapacity?: boolean;
};

type Rsvp = {
  id: string;
  status: string;
  partySize: number;
  primaryGuestName: string;
  appointmentStartsAt?: string | null;
};

type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  guestName?: string | null;
};

type ApiResponse<T> = { data: T; error?: { message?: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok) throw new Error(body.error?.message || "Request failed");
  return body.data;
}

function time(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || "America/Boise",
  }).format(new Date(value));
}

function date(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone || "America/Boise",
  }).format(new Date(value));
}

export default function EventOverviewPanel({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ event: EventData }>(`/api/admin/events/${eventId}`),
      api<{ rsvps: Rsvp[] }>(`/api/admin/events/${eventId}/rsvps`),
      api<{ slots: Slot[] }>(`/api/admin/events/${eventId}/schedule`),
    ])
      .then(([eventData, rsvpData, slotData]) => {
        setEvent(eventData.event);
        setRsvps(rsvpData.rsvps);
        setSlots(slotData.slots);
      })
      .catch(error => setError(error instanceof Error ? error.message : "Unable to load overview."));
  }, [eventId]);

  async function duplicateEvent() {
    if (duplicating) return;
    setDuplicating(true);
    setError("");

    try {
      const source = await api<{ event: Record<string, unknown> }>(`/api/admin/events/${eventId}`);
      const created = await api<{ event: { id: string } }>("/api/admin/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildEventPayload(source.event)),
      });

      location.href = `/admin/events/${created.event.id}/edit`;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to duplicate event.");
      setDuplicating(false);
    }
  }

  const confirmed = rsvps.filter(row => row.status === "confirmed");
  const confirmedGuests = confirmed.reduce((sum, row) => sum + Number(row.partySize || 0), 0);
  const bookedSlots = slots.filter(slot => Boolean(slot.guestName));
  const openSlots = slots.length - bookedSlots.length;
  const nextAppointment = useMemo(
    () => bookedSlots.find(slot => new Date(slot.startsAt).getTime() > Date.now()),
    [bookedSlots],
  );

  if (error && !event) return <main className="event-admin"><p className="event-alert">{error}</p></main>;
  if (!event) return <main className="event-admin"><p>Loading…</p></main>;

  return (
    <main className="event-admin">
      <header className="event-admin-header">
        <div>
          <Link href="/admin/events">Events</Link>
          <h1>{event.title}</h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {event.status === "archived" && (
            <button className="event-button" type="button" onClick={duplicateEvent} disabled={duplicating}>
              {duplicating ? "Duplicating…" : "Duplicate Event"}
            </button>
          )}
          <Link className="event-button event-button--secondary" href={`/admin/events/${eventId}/edit`}>Edit</Link>
        </div>
      </header>

      {error && <p className="event-alert">{error}</p>}

      <section className={styles.hero}>
        <div>
          <span className={`event-status event-status--${event.status}`}>{event.status}</span>
          <p className={styles.date}>{date(event.startsAt, event.timezone)}</p>
          <p>{time(event.startsAt, event.timezone)}–{time(event.endsAt, event.timezone)}</p>
          <p>{event.location}{event.locationDetails ? ` · ${event.locationDetails}` : ""}</p>
        </div>
        <div className={styles.capacity}>
          <span>Capacity</span>
          <strong>{event.unlimitedCapacity || event.capacity == null ? "Unlimited" : event.capacity}</strong>
        </div>
      </section>

      <nav className="event-tabs">
        <Link href={`/admin/events/${eventId}`}>Overview</Link>
        <Link href={`/admin/events/${eventId}/rsvps`}>RSVPs</Link>
        <Link href={`/admin/events/${eventId}/schedule`}>Schedule</Link>
        <Link href={`/admin/events/${eventId}/check-in`}>Check in</Link>
      </nav>

      <section className={styles.stats}>
        <article><span>RSVPs</span><strong>{confirmed.length}</strong><small>{confirmedGuests} attending</small></article>
        <article><span>Booked appointments</span><strong>{bookedSlots.length}</strong><small>{openSlots} open slots</small></article>
        <article><span>Schedule</span><strong>{slots.length}</strong><small>total appointment slots</small></article>
        <article><span>Next appointment</span><strong>{nextAppointment ? time(nextAppointment.startsAt, event.timezone) : "—"}</strong><small>{nextAppointment?.guestName || "No upcoming booking"}</small></article>
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}><h2>Recent RSVPs</h2><Link href={`/admin/events/${eventId}/rsvps`}>View all</Link></div>
          {rsvps.length ? rsvps.slice(0, 5).map(row => (
            <Link className={styles.row} href={`/admin/events/${eventId}/rsvps/${row.id}`} key={row.id}>
              <div><strong>{row.primaryGuestName}</strong><span>{row.status}</span></div>
              <div className={styles.rowRight}>{row.appointmentStartsAt ? time(row.appointmentStartsAt, event.timezone) : "No appointment"}</div>
            </Link>
          )) : <p className={styles.empty}>No RSVPs yet.</p>}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}><h2>Appointment schedule</h2><Link href={`/admin/events/${eventId}/schedule`}>Manage</Link></div>
          {slots.length ? slots.slice(0, 6).map(slot => (
            <div className={styles.row} key={slot.id}>
              <div><strong>{time(slot.startsAt, event.timezone)}</strong><span>to {time(slot.endsAt, event.timezone)}</span></div>
              <div className={styles.rowRight}>{slot.guestName || "Available"}</div>
            </div>
          )) : <p className={styles.empty}>No appointment slots scheduled.</p>}
        </div>
      </section>
    </main>
  );
}
