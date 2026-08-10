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

type CancellationResult = {
  cancelled: boolean;
  emailSent: boolean;
  warning?: string | null;
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

  function openRsvp(row: Rsvp) {
    window.location.href = `/admin/events/${eventId}/rsvps/${row.id}`;
  }

  async function cancelAppointment(row: Rsvp) {
    const confirmed = window.confirm(
      `Cancel ${row.primaryGuestName}'s appointment?\n\nThe appointment time will become available again and the client will receive a cancellation email.`,
    );

    if (!confirmed) return;

    try {
      setCancellingId(row.id);
      setError("");
      const result = await api<CancellationResult>(
        `/api/admin/events/${eventId}/rsvps/${row.id}/cancel`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      );
      if (result.warning) setError(result.warning);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  }

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
              <tr
                key={row.id}
                role="link"
                tabIndex={0}
                aria-label={`Open RSVP for ${row.primaryGuestName}`}
                style={{ cursor: "pointer" }}
                onClick={() => openRsvp(row)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openRsvp(row);
                  }
                }}
              >
                <td>
                  <strong>{row.primaryGuestName}</strong>
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
                  {row.appointmentStartsAt && row.status !== "cancelled" && (
                    <button
                      type="button"
                      className="event-link-button"
                      disabled={cancellingId === row.id || deletingId === row.id}
                      onClick={event => {
                        event.stopPropagation();
                        void cancelAppointment(row);
                      }}
                      onKeyDown={event => event.stopPropagation()}
                    >
                      {cancellingId === row.id ? "Cancelling…" : "Cancel appointment"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="event-link-button"
                    disabled={deletingId === row.id || cancellingId === row.id}
                    onClick={event => {
                      event.stopPropagation();
                      void remove(row);
                    }}
                    onKeyDown={event => event.stopPropagation()}
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
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ rsvp: Rsvp }>(`/api/admin/events/${eventId}/rsvps/${rsvpId}`);
    setRsvp(data.rsvp);
  }, [eventId, rsvpId]);

  useEffect(() => {
    load().catch(error =>
      setError(error instanceof Error ? error.message : "Unable to load RSVP."),
    );
  }, [load]);

  async function cancelAppointment() {
    if (!rsvp) return;

    const confirmed = window.confirm(
      `Cancel ${rsvp.primaryGuestName}'s appointment?\n\nThe appointment time will become available again and the client will receive a cancellation email.`,
    );
    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");
      const result = await api<CancellationResult>(
        `/api/admin/events/${eventId}/rsvps/${rsvpId}/cancel`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      );
      await load();
      if (result.warning) setError(result.warning);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to cancel appointment.");
    } finally {
      setCancelling(false);
    }
  }

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
          <div>
            {rsvp.appointmentStartsAt && rsvp.status !== "cancelled" && (
              <button
                type="button"
                className="event-button event-button--secondary"
                disabled={cancelling || deleting}
                onClick={cancelAppointment}
              >
                {cancelling ? "Cancelling…" : "Cancel appointment"}
              </button>
            )}
            <button
              type="button"
              className="event-button event-button--secondary"
              disabled={deleting || cancelling}
              onClick={remove}
            >
              {deleting ? "Deleting…" : "Delete RSVP"}
            </button>
          </div>
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
