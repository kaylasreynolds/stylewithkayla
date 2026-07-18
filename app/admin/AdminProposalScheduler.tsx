"use client";

import { useEffect, useMemo, useState } from "react";

export type ProposalRequest = {
  requestedStartAt: string;
  selectionSource: "public_availability" | "custom";
  overrideConfirmed: boolean;
};

type Slot = { startsAt: string; endsAt: string; source: string };
type Props = {
  serviceCode: string;
  reason: string;
  setReason: (value: string) => void;
  onCancel: () => void;
  onSave: (proposal: ProposalRequest) => Promise<void>;
};

const quarterHours = new Set([0, 15, 30, 45]);

function boiseDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Boise", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function boiseTimeValue(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Boise", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("hour")}:${part("minute")}`;
}

function displayTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Boise", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function boiseLocalToIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return "";
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let epoch = target;
  for (let index = 0; index < 4; index += 1) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Boise", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(epoch);
    const part = (type: string) => Number(parts.find(item => item.type === type)?.value);
    const represented = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"));
    const correction = target - represented;
    epoch += correction;
    if (!correction) break;
  }
  return new Date(epoch).toISOString();
}

function isQuarterHour(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return Boolean(match && quarterHours.has(Number(match[2])));
}

export default function AdminProposalScheduler({ serviceCode, reason, setReason, onCancel, onSave }: Props) {
  const [date, setDate] = useState(boiseDateKey());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!date || !serviceCode) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setSlots([]);
    fetch(`/api/availability?serviceCode=${encodeURIComponent(serviceCode)}&from=${date}&to=${date}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const payload = await response.json() as { data?: { slots?: Slot[] }; error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message || "Availability could not be loaded.");
        return payload.data?.slots ?? [];
      })
      .then(items => setSlots(items.filter(slot => quarterHours.has(Number(boiseTimeValue(slot.startsAt).split(":")[1])))))
      .catch(error => { if (error.name !== "AbortError") setLoadError(error instanceof Error ? error.message : "Availability could not be loaded."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [date, serviceCode]);

  const requestedStartAt = useMemo(() => date && time && isQuarterHour(time) ? boiseLocalToIso(date, time) : "", [date, time]);
  const isSuggestion = Boolean(requestedStartAt && slots.some(slot => slot.startsAt === requestedStartAt));
  const isFuture = Boolean(requestedStartAt && Date.parse(requestedStartAt) > Date.now());
  const outsidePublicAvailability = Boolean(requestedStartAt && !isSuggestion);
  const canSave = Boolean(requestedStartAt && isFuture && (!outsidePublicAvailability || overrideConfirmed) && !saving);

  function chooseSuggestion(slot: Slot) {
    setDate(boiseDateKey(new Date(slot.startsAt)));
    setTime(boiseTimeValue(slot.startsAt));
    setOverrideConfirmed(false);
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ requestedStartAt, selectionSource: isSuggestion ? "public_availability" : "custom", overrideConfirmed: outsidePublicAvailability ? overrideConfirmed : false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="action-panel admin-proposal-panel">
      <h3>Propose another time</h3>
      <label>
        Date
        <input type="date" min={boiseDateKey()} value={date} onChange={event => { setDate(event.target.value); setTime(""); setOverrideConfirmed(false); }} />
      </label>

      <div className="proposal-suggestions">
        <strong>Suggested public booking times</strong>
        {loading ? <p>Checking availability…</p> : loadError ? <p className="admin-warning">{loadError}</p> : slots.length ? <div className="proposal-time-grid">{slots.map(slot => <button type="button" key={slot.startsAt} className={requestedStartAt === slot.startsAt ? "selected" : ""} onClick={() => chooseSuggestion(slot)}>{displayTime(slot.startsAt)}</button>)}</div> : <p>No public booking times are available on this date. You may still choose a custom time below.</p>}
      </div>

      <label>
        Custom Boise time
        <input type="time" step={900} value={time} onChange={event => { setTime(event.target.value); setOverrideConfirmed(false); }} />
        <small>Use 15-minute increments: :00, :15, :30, or :45.</small>
      </label>

      {time && !isQuarterHour(time) && <p className="admin-warning" role="alert">Choose a time in 15-minute increments.</p>}
      {requestedStartAt && !isFuture && <p className="admin-warning" role="alert">Choose a future date and time.</p>}
      {outsidePublicAvailability && isFuture && <div className="proposal-override"><p>This time is outside the public booking calendar. You can still propose it as an admin accommodation.</p><label><input type="checkbox" checked={overrideConfirmed} onChange={event => setOverrideConfirmed(event.target.checked)} /> I have reviewed this custom appointment time.</label></div>}

      <label>
        Message or reason <span>(optional)</span>
        <textarea value={reason} onChange={event => setReason(event.target.value)} />
      </label>
      <div><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="primary-button" disabled={!canSave} onClick={() => void save()}>{saving ? "Saving…" : "Send proposed time"}</button></div>

      <style>{`
        .admin-proposal-panel { display: grid; gap: 16px; }
        .admin-proposal-panel label { display: grid; gap: 7px; }
        .admin-proposal-panel small { color: #746d6b; font-size: 12px; font-weight: 400; }
        .proposal-suggestions { display: grid; gap: 10px; }
        .proposal-time-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .proposal-time-grid button { min-width: 96px; }
        .proposal-time-grid button.selected { border-color: var(--rose); background: var(--blush); color: var(--rose-dark); }
        .proposal-override { padding: 14px; border: 1px solid #d6a55f; border-radius: 6px; background: #fff8e9; }
        .proposal-override p { margin: 0 0 10px; }
        .proposal-override label { display: flex; align-items: flex-start; gap: 9px; font-weight: 600; }
        .proposal-override input { width: auto; margin-top: 3px; }
      `}</style>
    </div>
  );
}
