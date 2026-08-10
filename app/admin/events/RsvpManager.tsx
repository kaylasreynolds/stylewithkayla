"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ApiResponse<T> = {
  data?: T;
  error?: { message?: string };
};

type Rsvp = {
  id: string;
  primaryGuestName: string;
  email: string;
  phone?: string;
  status: string;
  partySize: number;
  notes?: string;
  checkedInAt?: string | null;
  noShowAt?: string | null;
  appointmentStartsAt?: string | null;
  appointmentEndsAt?: string | null;
  appointmentLabel?: string | null;
  guests?: { id: string; name: string }[];
};

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Request failed.");
  }

  return json.data as T;
}

function formatAppointment(row: Rsvp) {
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

export function RsvpManager({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await api<{ rsvps: Rsvp[] }>(
        `/api/admin/events/${eventId}/rsvps${status ? `?status=${status}` : ""}`,
      );
      setRows(data.rsvps);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load RSVPs.");
    }
  }, [eventId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(row: Rsvp) {
    const confirmed = window.confirm(
      `Delete the RSVP for ${row.primaryGuestName}?\n\nThis permanently removes the RSVP and releases any appointment time attached to it.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(row.id);
      setError("");
      await api<{ deleted: boolean }>(
        `/api/admin/events/${eventId}/rsvps/${row.id}`,
        { method: "DELETE" },
      );
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete RSVP.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="event-admin">
      <header className="event-admin-header">
        <div>
          <Link href="/admin/events">Events</Link>
          <h1>RSVPs</h1>
        </div>
        <a
          className="event-button event-button--secondary"
          href={`/api/admin/events/${eventId}/rsvps/export`}
        >
          Export CSV
        </a>
      </header>

      <Tabs eventId={eventId} />

      {error && (
        <p className="event-alert" role="alert">
          {error}
        </p>
      )}

      <label className="event-filter">
        Status{" "}
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">All</option>
          <option value="confirmed">confirmed</option>
          <option value="waitlisted">waitlisted</option>
          <option value="cancelled">cancelled</option>
        </select>
      </label>

      <div className="event-table-wrap">
        <table className="event-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Appointment</th>
              <th>Status</th>
              <th>Party</th>
              <th>Arrival</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/events/${eventId}/rsvps/${row.id}`}>
                    {row.primaryGuestName}
                  </Link>
                  <small>{row.email}</small>
                </td>
                <td>{formatAppointment(row)}</td>
                <td>{row.status}</td>
                <td>{row.partySize}</td>
                <td>
                  {row.checkedInAt
                    ? "Checked in"
                    : row.noShowAt
                      ? "No show"
                      : "Pending"}
                </td>
                <td>
                  <button
                    type="button"
                    className="event-link-button"
                    disabled={deletingId === row.id}
                    onClick={() => remove(row)}
                  >
                    {deletingId === row.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6}>No RSVPs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export function RsvpDetailManager({
  eventId,
  rsvpId,
}: {
  eventId: string;
  rsvpId: string;
}) {
  const [rsvp, setRsvp] = useState<Rsvp | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api<{ rsvp: Rsvp }>(`/api/admin/events/${eventId}/rsvps/${rsvpId}`)
      .then(data => setRsvp(data.rsvp))
      .catch(error =>
        setError(error instanceof Error ? error.message : "Unable to load RSVP."),
      );
  }, [eventId, rsvpId]);

  async function remove() {
    if (!rsvp) return;

    const confirmed = window.confirm(
      `Delete the RSVP for ${rsvp.primaryGuestName}?\n\nThis cannot be undone. Any appointment time connected to this RSVP will become available again.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      await api<{ deleted: boolean }>(
        `/api/admin/events/${eventId}/rsvps/${rsvpId}`,
        { method: "DELETE" },
      );
      window.location.href = `/admin/events/${eventId}/rsvps`;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete RSVP.");
      setDeleting(false);
    }
  }

  return (
    <main className="event-admin">
      <header className="event-admin-header">
        <div>
          <Link href={`/admin/events/${eventId}/rsvps`}>← All RSVPs</Link>
          <h1>{rsvp?.primaryGuestName ?? "RSVP detail"}</h1>
        </div>
        {rsvp && (
          <button
            type="button"
            className="event-button event-button--secondary"
            disabled={deleting}
            onClick={remove}
          >
            {deleting ? "Deleting…" : "Delete RSVP"}
          </button>
        )}
      </header>

      <Tabs eventId={eventId} />

      {error && (
        <p className="event-alert" role="alert">
          {error}
        </p>
      )}

      {rsvp && (
        <div className="event-detail">
          <p>
            <strong>{rsvp.email}</strong>
            <br />
            {rsvp.phone || "—"}
          </p>
          <dl>
            <dt>Status</dt>
            <dd>{rsvp.status}</dd>
            <dt>Appointment</dt>
            <dd>{formatAppointment(rsvp)}</dd>
            <dt>Party size</dt>
            <dd>{rsvp.partySize}</dd>
            <dt>Notes</dt>
            <dd>{rsvp.notes || "—"}</dd>
          </dl>
          <h2>Additional guests</h2>
          {rsvp.guests?.length ? (
            rsvp.guests.map(guest => <p key={guest.id}>{guest.name}</p>)
          ) : (
            <p>None</p>
          )}
        </div>
      )}
    </main>
  );
}
