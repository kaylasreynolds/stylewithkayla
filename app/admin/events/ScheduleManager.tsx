"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./ScheduleManager.module.css";

type EventData = {
  id?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  status: string;
};

type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  rsvpId?: string | null;
  guestName?: string | null;
  label?: string | null;
};

type ApiResponse<T> = {
  data?: T;
  error?: { message?: string };
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.data) throw new Error(body.error?.message || "Request failed");
  return body.data;
}

function timeValue(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function displayTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function displayRange(start: string, end: string) {
  return `${displayTime(start)} – ${displayTime(end)}`;
}

function dateWithTime(base: string, hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date(base);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function ScheduleManager({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "booked">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [eventResult, scheduleResult] = await Promise.all([
      request<{ event: EventData }>(`/api/admin/events/${eventId}`),
      request<{ slots: Slot[] }>(`/api/admin/events/${eventId}/schedule`),
    ]);
    setEvent(eventResult.event);
    setSlots(scheduleResult.slots);
    setStartTime(current => current || timeValue(eventResult.event.startsAt));
    setEndTime(current => current || timeValue(eventResult.event.endsAt));
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      request<{ event: EventData }>(`/api/admin/events/${eventId}`),
      request<{ slots: Slot[] }>(`/api/admin/events/${eventId}/schedule`),
    ])
      .then(([eventResult, scheduleResult]) => {
        if (cancelled) return;
        setEvent(eventResult.event);
        setSlots(scheduleResult.slots);
        setStartTime(timeValue(eventResult.event.startsAt));
        setEndTime(timeValue(eventResult.event.endsAt));
      })
      .catch(error => {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Unable to load schedule.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const candidates = useMemo(() => {
    if (!event || !startTime || !endTime || duration < 5) return [];
    const start = dateWithTime(event.startsAt, startTime);
    const end = dateWithTime(event.startsAt, endTime);
    if (end <= start) return [];
    const result: { startsAt: Date; endsAt: Date }[] = [];
    let cursor = start.getTime();
    const eventEnd = end.getTime();
    while (cursor + duration * 60_000 <= eventEnd && result.length < 200) {
      const slotEnd = cursor + duration * 60_000;
      result.push({ startsAt: new Date(cursor), endsAt: new Date(slotEnd) });
      cursor = slotEnd + buffer * 60_000;
    }
    return result;
  }, [event, startTime, endTime, duration, buffer]);

  const bookedCount = slots.filter(slot => Boolean(slot.rsvpId || slot.guestName)).length;
  const availableCount = slots.length - bookedCount;

  const visibleSlots = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return slots.filter(slot => {
      const booked = Boolean(slot.rsvpId || slot.guestName);
      if (filter === "available" && booked) return false;
      if (filter === "booked" && !booked) return false;
      if (!needle) return true;
      return `${displayRange(slot.startsAt, slot.endsAt)} ${slot.guestName || ""} ${slot.label || ""}`.toLowerCase().includes(needle);
    });
  }, [slots, query, filter]);

  async function generate() {
    if (!event || !candidates.length) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let created = 0;
      for (const candidate of candidates) {
        const exactExists = slots.some(slot =>
          new Date(slot.startsAt).getTime() === candidate.startsAt.getTime() &&
          new Date(slot.endsAt).getTime() === candidate.endsAt.getTime(),
        );
        if (exactExists) continue;
        await request<{ slot: Slot }>(`/api/admin/events/${eventId}/schedule`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            startsAt: candidate.startsAt.toISOString(),
            endsAt: candidate.endsAt.toISOString(),
          }),
        });
        created += 1;
      }
      await load();
      setNotice(created ? `${created} appointment slot${created === 1 ? "" : "s"} created.` : "Those appointment slots already exist.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to generate appointment slots.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSlot(slot: Slot) {
    if (slot.rsvpId || slot.guestName) {
      setError("Booked appointment slots cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete ${displayRange(slot.startsAt, slot.endsAt)}?`)) return;
    setBusy(true);
    setError("");
    try {
      await request<{ deleted: boolean }>(`/api/admin/events/${eventId}/schedule?slotId=${encodeURIComponent(slot.id)}`, { method: "DELETE" });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete appointment slot.");
    } finally {
      setBusy(false);
    }
  }

  async function clearAvailable() {
    const removable = slots.filter(slot => !slot.rsvpId && !slot.guestName);
    if (!removable.length) return;
    if (!window.confirm(`Delete all ${removable.length} available appointment slots? Booked appointments will stay in place.`)) return;
    setBusy(true);
    setError("");
    try {
      for (const slot of removable) {
        await request<{ deleted: boolean }>(`/api/admin/events/${eventId}/schedule?slotId=${encodeURIComponent(slot.id)}`, { method: "DELETE" });
      }
      await load();
      setNotice("Available appointment slots cleared.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to clear appointment slots.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/events" className={styles.back}>Events</Link>
          <span className={styles.chevron}>›</span>
          <span>{event?.title || "Event"}</span>
          <h1>{event?.title || "Appointment schedule"}</h1>
          {event && (
            <div className={styles.meta}>
              <span className={styles.status}>{event.status}</span>
              <span>{new Date(event.startsAt).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}</span>
              <span>•</span>
              <span>{displayRange(event.startsAt, event.endsAt)}</span>
              <span>•</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>
        <Link className={styles.editButton} href={`/admin/events/${eventId}/edit`}>Edit Event</Link>
      </header>

      <nav className={styles.tabs} aria-label="Event sections">
        <Link href={`/admin/events/${eventId}`}>Overview</Link>
        <Link href={`/admin/events/${eventId}/rsvps`}>RSVPs</Link>
        <Link className={styles.activeTab} href={`/admin/events/${eventId}/schedule`}>Schedule</Link>
        <Link href={`/admin/events/${eventId}/check-in`}>Check in</Link>
      </nav>

      <section className={styles.intro}>
        <h2>Appointment schedule</h2>
        <p>Create and manage appointment slots for this event.</p>
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      <div className={styles.topGrid}>
        <section className={styles.card}>
          <h3>Generate appointment slots</h3>
          <div className={styles.formGrid}>
            <label>Start time<input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
            <label>End time<input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
            <label>Appointment length<select value={duration} onChange={e => setDuration(Number(e.target.value))}><option value={15}>15 minutes</option><option value={20}>20 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label>
            <label>Buffer between appointments<select value={buffer} onChange={e => setBuffer(Number(e.target.value))}><option value={0}>0 minutes</option><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option></select></label>
          </div>
          <div className={styles.previewBox}>
            <strong>This will create {candidates.length} appointment slot{candidates.length === 1 ? "" : "s"}.</strong>
            <span>{startTime && endTime ? `From ${displayTime(dateWithTime(event?.startsAt || new Date().toISOString(), startTime).toISOString())} to ${displayTime(dateWithTime(event?.startsAt || new Date().toISOString(), endTime).toISOString())} with ${duration}-minute appointments${buffer ? ` and a ${buffer}-minute buffer` : " and no buffer"}.` : "Choose a start and end time."}</span>
          </div>
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="button" disabled={busy || !candidates.length} onClick={generate}>{busy ? "Working…" : "Generate Schedule"}</button>
            <button className={styles.textButton} type="button" disabled={busy || !availableCount} onClick={clearAvailable}>Clear available</button>
          </div>
        </section>

        <aside className={`${styles.card} ${styles.summary}`}>
          <h3>Schedule summary</h3>
          {event && <><span>Event time</span><strong>{displayRange(event.startsAt, event.endsAt)}</strong></>}
          <span>Appointment length</span><strong>{duration} minutes</strong>
          <span>Buffer</span><strong>{buffer} minutes</strong>
          <span>Total slots</span><strong className={styles.bigNumber}>{slots.length}</strong>
          <span>Booked</span><strong>{bookedCount}</strong>
          <span>Available</span><strong className={styles.available}>{availableCount}</strong>
        </aside>
      </div>

      <section className={`${styles.card} ${styles.slotsCard}`}>
        <div className={styles.slotsHeader}>
          <h3>Appointment slots ({slots.length})</h3>
          <input className={styles.search} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search slots…" aria-label="Search appointment slots" />
        </div>
        <div className={styles.filters}>
          <button className={filter === "all" ? styles.filterActive : ""} onClick={() => setFilter("all")}>All ({slots.length})</button>
          <button className={filter === "available" ? styles.filterActive : ""} onClick={() => setFilter("available")}>Available ({availableCount})</button>
          <button className={filter === "booked" ? styles.filterActive : ""} onClick={() => setFilter("booked")}>Booked ({bookedCount})</button>
        </div>

        {!slots.length ? (
          <div className={styles.empty}>
            <h4>No appointment slots yet</h4>
            <p>Use the schedule generator above to create the times customers can choose from.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Time</th><th>Status</th><th>Booked by</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleSlots.map(slot => {
                  const booked = Boolean(slot.rsvpId || slot.guestName);
                  return <tr key={slot.id}>
                    <td>{displayRange(slot.startsAt, slot.endsAt)}</td>
                    <td><span className={booked ? styles.bookedBadge : styles.availableBadge}>{booked ? "Booked" : "Available"}</span></td>
                    <td>{slot.guestName || "—"}</td>
                    <td><button className={styles.deleteButton} type="button" disabled={busy || booked} onClick={() => removeSlot(slot)}>{booked ? "Booked" : "Delete"}</button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
