"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Rsvp = {
  id: string;
  primaryGuestName: string;
  email: string;
  partySize: number;
  status: string;
  checkedInAt: string | null;
  noShowAt: string | null;
  appointmentStartsAt?: string | null;
  appointmentEndsAt?: string | null;
  appointmentLabel?: string | null;
};

type ApiResponse<T> = { data: T; error?: { message?: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok) throw new Error(body.error?.message || "Request failed");
  return body.data;
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Boise",
  }).format(new Date(value));
}

export default function RsvpTableView({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    return api<{ rsvps: Rsvp[] }>(
      `/api/admin/events/${eventId}/rsvps${status ? `?status=${status}` : ""}`,
    )
      .then(data => setRows(data.rsvps))
      .catch(error => setError(error instanceof Error ? error.message : "Unable to load RSVPs."));
  }, [eventId, status]);

  useEffect(() => {
    let cancelled = false;

    api<{ rsvps: Rsvp[] }>(
      `/api/admin/events/${eventId}/rsvps${status ? `?status=${status}` : ""}`,
    )
      .then(data => {
        if (!cancelled) setRows(data.rsvps);
      })
      .catch(error => {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Unable to load RSVPs.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, status]);

  async function remove(row: Rsvp) {
    if (!window.confirm(`Delete RSVP for ${row.primaryGuestName}? This cannot be undone.`)) return;
    try {
      await api<Record<string, unknown>>(`/api/admin/events/${eventId}/rsvps/${row.id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete RSVP.");
    }
  }

  return (
    <main className="event-admin">
      <header className="event-admin-header">
        <div><Link href="/admin/events">Events</Link><h1>RSVPs</h1></div>
        <a className="event-button event-button--secondary" href={`/api/admin/events/${eventId}/rsvps/export`}>Export CSV</a>
      </header>

      <nav className="event-tabs">
        <Link href={`/admin/events/${eventId}`}>Overview</Link>
        <Link href={`/admin/events/${eventId}/rsvps`}>RSVPs</Link>
        <Link href={`/admin/events/${eventId}/schedule`}>Schedule</Link>
        <Link href={`/admin/events/${eventId}/check-in`}>Check in</Link>
      </nav>

      {error && <p className="event-alert">{error}</p>}

      <label className="event-filter">Status{" "}
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">All</option><option>confirmed</option><option>waitlisted</option><option>cancelled</option>
        </select>
      </label>

      <div className="event-table-wrap">
        <table className="event-table">
          <thead><tr><th>Guest</th><th>Appointment</th><th>Status</th><th>Party</th><th>Arrival</th><th></th></tr></thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td><Link href={`/admin/events/${eventId}/rsvps/${row.id}`}>{row.primaryGuestName}</Link><small>{row.email}</small></td>
                <td>{row.appointmentLabel || (row.appointmentStartsAt ? `${formatTime(row.appointmentStartsAt)}–${formatTime(row.appointmentEndsAt)}` : "No appointment")}</td>
                <td>{row.status}</td>
                <td>{row.partySize}</td>
                <td>{row.checkedInAt ? "Checked in" : row.noShowAt ? "No show" : "Pending"}</td>
                <td><button className="event-link-button" type="button" onClick={() => remove(row)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !error && <p className="event-empty">No RSVPs found.</p>}
      </div>
    </main>
  );
}
