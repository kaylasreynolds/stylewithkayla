"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./CheckInManager.module.css";

type ApiResponse<T> = {
  data?: T;
  error?: { message?: string };
};

type Rsvp = {
  id: string;
  primaryGuestName: string;
  status: string;
  partySize: number;
  notes?: string | null;
  checkedInAt?: string | null;
  noShowAt?: string | null;
  appointmentStartsAt?: string | null;
  appointmentEndsAt?: string | null;
  appointmentLabel?: string | null;
};

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok) throw new Error(json.error?.message ?? "Request failed.");
  return json.data as T;
}

function appointment(row: Rsvp) {
  if (row.appointmentLabel) return row.appointmentLabel;
  if (!row.appointmentStartsAt) return "No appointment";

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Boise",
  });
  const start = formatter.format(new Date(row.appointmentStartsAt));
  const end = row.appointmentEndsAt
    ? formatter.format(new Date(row.appointmentEndsAt))
    : "";
  return end ? `${start}–${end}` : start;
}

function Tabs({ eventId }: { eventId: string }) {
  return (
    <nav className="event-tabs">
      <Link href={`/admin/events/${eventId}`}>Overview</Link>
      <Link href={`/admin/events/${eventId}/rsvps`}>RSVPs</Link>
      <Link href={`/admin/events/${eventId}/schedule`}>Schedule</Link>
      <Link href={`/admin/events/${eventId}/check-in`}>Check in</Link>
    </nav>
  );
}

export default function CheckInManager({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await api<{ rsvps: Rsvp[] }>(
        `/api/admin/events/${eventId}/rsvps?status=confirmed`,
      );
      setRows(data.rsvps);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load RSVPs.");
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function mark(rsvpId: string, action: "checked_in" | "no_show") {
    try {
      setWorkingId(rsvpId);
      setError("");
      await api<Record<string, unknown>>(`/api/admin/events/${eventId}/check-ins`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rsvpId, action }),
      });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update check-in status.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="event-admin">
      <header className="event-admin-header">
        <div>
          <Link href="/admin/events">Events</Link>
          <h1>Check-in mode</h1>
        </div>
      </header>

      <Tabs eventId={eventId} />

      {error && <p className="event-alert">{error}</p>}

      <div className={styles.list}>
        {rows.map(row => (
          <article className={styles.card} key={row.id}>
            <div className={styles.identity}>
              <div className={styles.nameRow}>
                <h2 className={styles.name}>{row.primaryGuestName}</h2>
                <span className={styles.time}>{appointment(row)}</span>
              </div>
              {row.partySize > 1 && (
                <p className={styles.meta}>Party of {row.partySize}</p>
              )}
            </div>

            <div className={styles.actions}>
              <button
                className="event-button"
                disabled={workingId === row.id}
                onClick={() => mark(row.id, "checked_in")}
              >
                {row.checkedInAt ? "Checked in ✓" : "Check in"}
              </button>
              <button
                className="event-link-button"
                disabled={workingId === row.id}
                onClick={() => mark(row.id, "no_show")}
              >
                No show
              </button>
            </div>

            <div className={styles.notes}>
              <strong>Client notes</strong>
              {row.notes?.trim() ? row.notes : <span className={styles.empty}>No notes provided.</span>}
            </div>
          </article>
        ))}

        {!rows.length && !error && <p>No confirmed RSVPs to check in.</p>}
      </div>
    </main>
  );
}
