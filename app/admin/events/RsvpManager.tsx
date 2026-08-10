"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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

type ScheduleSlot = {
  id: string;
  rsvpId?: string | null;
  startsAt: string;
  endsAt: string;
  label?: string | null;
  guestName?: string | null;
};

type EventInfo = {
  title?: string;
  startsAt: string;
  endsAt: string;
  appointmentRequired?: boolean;
};

type CreateRsvpResult = {
  rsvp: Rsvp;
  emailSent: boolean;
  warning?: string | null;
};

type AppointmentMode = "none" | "available" | "custom";

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Request failed.");
  }

  return json.data as T;
}

function formatAppointment(row: Rsvp) {
  if (row.appointmentLabel && row.appointmentLabel !== "Custom admin appointment") {
    return row.appointmentLabel;
  }
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

function formatSlotTime(startsAt: string, endsAt?: string | null) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Boise",
  });
  const start = formatter.format(new Date(startsAt));
  const end = endsAt ? formatter.format(new Date(endsAt)) : "";
  return end ? `${start}–${end}` : start;
}

function formatCustomTime(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Boise",
  }).format(new Date(value));
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

function AddRsvpModal({
  eventId,
  onClose,
  onCreated,
}: {
  eventId: string;
  onClose: () => void;
  onCreated: (message: string, warning?: string | null) => void;
}) {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [guestNames, setGuestNames] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [appointmentMode, setAppointmentMode] = useState<AppointmentMode>("none");
  const [appointmentSlotId, setAppointmentSlotId] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customDuration, setCustomDuration] = useState("30");
  const [sendConfirmation, setSendConfirmation] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ event: EventInfo }>(`/api/admin/events/${eventId}`),
      api<{ slots: ScheduleSlot[] }>(`/api/admin/events/${eventId}/schedule`),
    ])
      .then(([eventData, scheduleData]) => {
        if (cancelled) return;
        setEvent(eventData.event);
        setSlots(scheduleData.slots);
        const available = scheduleData.slots.filter(slot => !slot.rsvpId);
        if (available.length) {
          setAppointmentMode("available");
          setAppointmentSlotId(available[0].id);
        }
      })
      .catch(loadError => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load event details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const availableSlots = useMemo(() => slots.filter(slot => !slot.rsvpId), [slots]);

  const customTimes = useMemo(() => {
    if (!event?.startsAt || !event?.endsAt) return [];
    const start = new Date(event.startsAt).getTime();
    const end = new Date(event.endsAt).getTime();
    const quarter = 15 * 60 * 1000;
    const first = Math.ceil(start / quarter) * quarter;
    const values: number[] = [];
    for (let value = first; value < end; value += quarter) values.push(value);
    return values;
  }, [event]);

  const selectedCustomStart = customStart || String(customTimes[0] ?? "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Full name and email are required.");
      return;
    }

    if (event?.appointmentRequired && appointmentMode === "none") {
      setError("This event requires an appointment time.");
      return;
    }

    const guests = guestNames
      .split(/[\n,]/)
      .map(value => value.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      primaryGuestName: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      partySize: Number(partySize),
      notes: notes.trim() || undefined,
      status,
      guests,
      sendConfirmation,
    };

    if (appointmentMode === "available") {
      if (!appointmentSlotId) {
        setError("Choose an available appointment time.");
        return;
      }
      payload.appointmentSlotId = appointmentSlotId;
    }

    if (appointmentMode === "custom") {
      const startMs = Number(selectedCustomStart);
      const duration = Number(customDuration);
      if (!startMs || !duration) {
        setError("Choose a custom start time and duration.");
        return;
      }
      payload.customStartsAt = new Date(startMs).toISOString();
      payload.customEndsAt = new Date(startMs + duration * 60 * 1000).toISOString();
    }

    try {
      setSaving(true);
      const result = await api<CreateRsvpResult>(`/api/admin/events/${eventId}/rsvps`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const appointment = result.rsvp.appointmentStartsAt
        ? ` for ${formatAppointment(result.rsvp)}`
        : "";
      onCreated(`${result.rsvp.primaryGuestName} has been added${appointment}.`, result.warning);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to add RSVP.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(31, 31, 31, 0.38)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        overflowY: "auto",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-rsvp-title"
        style={{
          width: "min(720px, 100%)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          boxShadow: "0 24px 70px rgba(45, 31, 31, 0.18)",
          padding: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 22,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                color: "var(--rose-dark)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".18em",
                textTransform: "uppercase",
              }}
            >
              Admin registration
            </p>
            <h2 id="add-rsvp-title" style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 34 }}>
              Add RSVP
            </h2>
          </div>
          <button
            type="button"
            className="event-button event-button--secondary"
            onClick={onClose}
            disabled={saving}
            aria-label="Close Add RSVP"
          >
            Close
          </button>
        </div>

        {error && (
          <p className="event-alert" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading event details…</p>
        ) : (
          <form onSubmit={submit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              <label style={{ display: "grid", gap: 7, gridColumn: "1 / -1" }}>
                <span>Full Name *</span>
                <input value={name} onChange={e => setName(e.target.value)} autoFocus />
              </label>
              <label style={{ display: "grid", gap: 7 }}>
                <span>Email *</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 7 }}>
                <span>Phone</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 7 }}>
                <span>Party Size</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={e => setPartySize(e.target.value)}
                />
              </label>
              <label style={{ display: "grid", gap: 7 }}>
                <span>Status</span>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="confirmed">Confirmed</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 7, gridColumn: "1 / -1" }}>
                <span>Additional Guest Names</span>
                <textarea
                  rows={2}
                  value={guestNames}
                  onChange={e => setGuestNames(e.target.value)}
                  placeholder="One name per line or separated by commas"
                />
              </label>
            </div>

            <fieldset
              style={{
                margin: "24px 0 0",
                padding: 20,
                border: "1px solid var(--line)",
                borderRadius: 10,
                background: "rgba(246, 238, 235, .42)",
              }}
            >
              <legend style={{ padding: "0 8px", fontWeight: 700 }}>Appointment Time</legend>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <button
                  type="button"
                  className={`event-button ${appointmentMode === "none" ? "" : "event-button--secondary"}`}
                  onClick={() => setAppointmentMode("none")}
                >
                  No appointment
                </button>
                <button
                  type="button"
                  className={`event-button ${appointmentMode === "available" ? "" : "event-button--secondary"}`}
                  onClick={() => setAppointmentMode("available")}
                  disabled={!availableSlots.length}
                >
                  Available Times
                </button>
                <button
                  type="button"
                  className={`event-button ${appointmentMode === "custom" ? "" : "event-button--secondary"}`}
                  onClick={() => setAppointmentMode("custom")}
                >
                  Custom Time
                </button>
              </div>

              {appointmentMode === "available" && (
                <label style={{ display: "grid", gap: 7 }}>
                  <span>Available appointment</span>
                  <select
                    value={appointmentSlotId}
                    onChange={e => setAppointmentSlotId(e.target.value)}
                  >
                    {availableSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label || formatSlotTime(slot.startsAt, slot.endsAt)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {appointmentMode === "custom" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(160px, .6fr)",
                    gap: 14,
                  }}
                >
                  <label style={{ display: "grid", gap: 7 }}>
                    <span>Start Time</span>
                    <select value={selectedCustomStart} onChange={e => setCustomStart(e.target.value)}>
                      {customTimes.map(value => (
                        <option key={value} value={value}>
                          {formatCustomTime(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 7 }}>
                    <span>Duration</span>
                    <select
                      value={customDuration}
                      onChange={e => setCustomDuration(e.target.value)}
                    >
                      {[15, 30, 45, 60, 75, 90, 105, 120].map(minutes => (
                        <option key={minutes} value={minutes}>
                          {minutes} minutes
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {appointmentMode === "custom" && (
                <p style={{ margin: "12px 0 0", color: "var(--charcoal)", fontSize: 12 }}>
                  Custom appointments use 15-minute increments and can be created even when that
                  start time is not offered publicly. Existing appointment conflicts are still blocked.
                </p>
              )}
            </fieldset>

            <label style={{ display: "grid", gap: 7, marginTop: 20 }}>
              <span>Notes</span>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 18,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={sendConfirmation}
                onChange={e => setSendConfirmation(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>Send confirmation to client</span>
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 26,
                paddingTop: 20,
                borderTop: "1px solid var(--line)",
              }}
            >
              <button
                type="button"
                className="event-button event-button--secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="event-button" disabled={saving}>
                {saving ? "Adding…" : "Add RSVP"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export function RsvpManager({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await api<{ rsvps: Rsvp[] }>(
        `/api/admin/events/${eventId}/rsvps${status ? `?status=${status}` : ""}`,
      );
      setRows(data.rsvps);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load RSVPs.");
    }
  }, [eventId, status]);

  useEffect(() => {
    let cancelled = false;

    api<{ rsvps: Rsvp[] }>(
      `/api/admin/events/${eventId}/rsvps${status ? `?status=${status}` : ""}`,
    )
      .then(data => {
        if (!cancelled) setRows(data.rsvps);
      })
      .catch(loadError => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load RSVPs.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, status]);

  function openRsvp(row: Rsvp) {
    router.push(`/admin/events/${eventId}/rsvps/${row.id}`);
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
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel appointment.");
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
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete RSVP.");
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
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className="event-button" onClick={() => setShowAddModal(true)}>
            + Add RSVP
          </button>
          <a
            className="event-button event-button--secondary"
            href={`/api/admin/events/${eventId}/rsvps/export`}
          >
            Export CSV
          </a>
        </div>
      </header>

      <Tabs eventId={eventId} />

      {success && (
        <p
          role="status"
          style={{
            padding: "12px 14px",
            border: "1px solid rgba(207, 140, 147, .55)",
            borderRadius: 8,
            background: "var(--blush)",
          }}
        >
          {success}
        </p>
      )}

      {error && (
        <p className="event-alert" role="alert">
          {error}
        </p>
      )}

      <label className="event-filter">
        Status{" "}
        <select value={status} onChange={filterEvent => setStatus(filterEvent.target.value)}>
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
                onKeyDown={keyEvent => {
                  if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                    keyEvent.preventDefault();
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
                      onClick={clickEvent => {
                        clickEvent.stopPropagation();
                        void cancelAppointment(row);
                      }}
                      onKeyDown={keyEvent => keyEvent.stopPropagation()}
                    >
                      {cancellingId === row.id ? "Cancelling…" : "Cancel appointment"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="event-link-button"
                    disabled={deletingId === row.id || cancellingId === row.id}
                    onClick={clickEvent => {
                      clickEvent.stopPropagation();
                      void remove(row);
                    }}
                    onKeyDown={keyEvent => keyEvent.stopPropagation()}
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

      {showAddModal && (
        <AddRsvpModal
          eventId={eventId}
          onClose={() => setShowAddModal(false)}
          onCreated={(message, warning) => {
            setShowAddModal(false);
            setSuccess(message);
            setError(warning ?? "");
            void load();
          }}
        />
      )}
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
  const router = useRouter();
  const [rsvp, setRsvp] = useState<Rsvp | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ rsvp: Rsvp }>(`/api/admin/events/${eventId}/rsvps/${rsvpId}`);
    setRsvp(data.rsvp);
  }, [eventId, rsvpId]);

  useEffect(() => {
    let cancelled = false;

    api<{ rsvp: Rsvp }>(`/api/admin/events/${eventId}/rsvps/${rsvpId}`)
      .then(data => {
        if (!cancelled) setRsvp(data.rsvp);
      })
      .catch(loadError => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load RSVP.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, rsvpId]);

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
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel appointment.");
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
      router.push(`/admin/events/${eventId}/rsvps`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete RSVP.");
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
