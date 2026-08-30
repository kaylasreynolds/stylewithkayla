"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Rule = { weekday: number; startMinute: number; endMinute: number };
type Override = {
  id: string;
  kind: "available" | "unavailable";
  startsAt: string;
  endsAt: string;
  note: string | null;
};
type Service = { code: string; name: string; durationMinutes: number };
type Slot = { startsAt: string; endsAt: string };
type Impact = { serviceCode: string; serviceName: string; durationMinutes: number; slots: Slot[] };

const days = [
  [2, "Tuesday"],
  [3, "Wednesday"],
  [4, "Thursday"],
  [5, "Friday"],
  [6, "Saturday"],
] as const;
const quarterHours = new Set([0, 15, 30, 45]);

const asTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const asMinutes = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

function snapDateTimeLocalToQuarterHour(value: string) {
  if (!value) return "";
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return value;

  const snappedMinutes = Math.round((hour * 60 + minute) / 15) * 15;
  const snapped = new Date(Date.UTC(year, month - 1, day, 0, snappedMinutes));
  return `${snapped.getUTCFullYear()}-${String(snapped.getUTCMonth() + 1).padStart(2, "0")}-${String(snapped.getUTCDate()).padStart(2, "0")}T${String(snapped.getUTCHours()).padStart(2, "0")}:${String(snapped.getUTCMinutes()).padStart(2, "0")}`;
}

function boiseLocalToIso(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let epoch = target;

  for (let index = 0; index < 4; index += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Boise",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(epoch);
    const part = (type: string) => Number(parts.find(item => item.type === type)?.value);
    const represented = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
    );
    const correction = target - represented;
    epoch += correction;
    if (!correction) break;
  }

  return new Date(epoch).toISOString();
}

function localDate(value: string) {
  return value.split("T")[0] ?? "";
}

function isQuarterHour(value: string) {
  if (!value) return false;
  const time = value.split("T")[1] ?? "";
  const minute = Number(time.split(":")[1]);
  return quarterHours.has(minute);
}

function overlaps(blockStart: number, blockEnd: number, slot: Slot) {
  const slotStart = Date.parse(slot.startsAt);
  const slotEnd = Date.parse(slot.endsAt);
  return slotStart < blockEnd && slotEnd > blockStart;
}

const fmt = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Boise",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const fmtTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Boise",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

function fmtLocalInput(value: string) {
  if (!value) return "";
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Date.UTC(year, month - 1, day, hour, minute)));
}

export default function AdminAvailability({ userName, signOutPath }: { userName: string; signOutPath: string }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [kind, setKind] = useState<"available" | "unavailable">("unavailable");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [note, setNote] = useState("");
  const [impact, setImpact] = useState<Impact[]>([]);
  const [checkingImpact, setCheckingImpact] = useState(false);
  const [impactError, setImpactError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [availabilityResponse, servicesResponse] = await Promise.all([
        fetch("/api/admin/settings/availability", { cache: "no-store" }),
        fetch("/api/services", { cache: "no-store" }),
      ]);
      const availabilityPayload = (await availabilityResponse.json()) as {
        data?: { rules: Rule[]; overrides: Override[] };
        error?: { message?: string };
      };
      const servicesPayload = (await servicesResponse.json()) as {
        data?: { services: Service[] };
        error?: { message?: string };
      };
      if (!availabilityResponse.ok) throw new Error(availabilityPayload.error?.message);
      if (!servicesResponse.ok) throw new Error(servicesPayload.error?.message);
      setRules(availabilityPayload.data!.rules);
      setOverrides(availabilityPayload.data!.overrides);
      setServices(servicesPayload.data?.services ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Availability could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const blockValidation = useMemo(() => {
    if (!startsAt || !endsAt) return "";
    if (!isQuarterHour(startsAt) || !isQuarterHour(endsAt)) return "Use 15-minute increments (:00, :15, :30, or :45).";
    const start = Date.parse(boiseLocalToIso(startsAt));
    const end = Date.parse(boiseLocalToIso(endsAt));
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return "The end time must be after the start time.";
    if (end - start > 7 * 86400000) return "An override cannot span more than seven days.";
    return "";
  }, [startsAt, endsAt]);

  useEffect(() => {
    if (kind !== "unavailable" || !startsAt || !endsAt || blockValidation || !services.length) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void Promise.resolve().then(async () => {
        setCheckingImpact(true);
        setImpactError("");
        const blockStart = Date.parse(boiseLocalToIso(startsAt));
        const blockEnd = Date.parse(boiseLocalToIso(endsAt));
        const from = localDate(startsAt);
        const to = localDate(endsAt);

        try {
          const results = await Promise.all(
            services.map(async service => {
              const response = await fetch(
                `/api/availability?serviceCode=${encodeURIComponent(service.code)}&from=${from}&to=${to}`,
                { cache: "no-store", signal: controller.signal },
              );
              const payload = (await response.json()) as {
                data?: { slots?: Slot[] };
                error?: { message?: string };
              };
              if (!response.ok) throw new Error(payload.error?.message || `Could not check ${service.name}.`);
              return {
                serviceCode: service.code,
                serviceName: service.name,
                durationMinutes: service.durationMinutes,
                slots: (payload.data?.slots ?? []).filter(slot => overlaps(blockStart, blockEnd, slot)),
              } satisfies Impact;
            }),
          );
          if (!controller.signal.aborted) setImpact(results.filter(result => result.slots.length));
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          if (!controller.signal.aborted) {
            setImpact([]);
            setImpactError(cause instanceof Error ? cause.message : "Affected appointment times could not be checked.");
          }
        } finally {
          if (!controller.signal.aborted) setCheckingImpact(false);
        }
      });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [kind, startsAt, endsAt, blockValidation, services]);

  function change(day: number, index: number, key: "startMinute" | "endMinute", value: string) {
    const dayRules = rules.filter(rule => rule.weekday === day);
    const target = dayRules[index];
    setRules(current => current.map(rule => (rule === target ? { ...rule, [key]: asMinutes(value) } : rule)));
  }

  function addWindow(day: number) {
    setRules(current => [...current, { weekday: day, startMinute: 630, endMinute: 810 }]);
  }

  function removeWindow(day: number, index: number) {
    const target = rules.filter(rule => rule.weekday === day)[index];
    setRules(current => current.filter(rule => rule !== target));
  }

  async function saveRules() {
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/admin/settings/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message);
      setSaved("Routine availability saved.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Routine availability could not be saved.");
    }
  }

  async function addOverride() {
    setError("");
    setSaved("");
    if (blockValidation) {
      setError(blockValidation);
      return;
    }
    try {
      const savedStart = startsAt;
      const savedEnd = endsAt;
      const response = await fetch("/api/admin/settings/availability/overrides", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          startsAt: boiseLocalToIso(savedStart),
          endsAt: boiseLocalToIso(savedEnd),
          note: note || null,
        }),
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message);
      setSaved(
        kind === "unavailable"
          ? `Blocked ${fmtLocalInput(savedStart)} to ${fmtLocalInput(savedEnd)} Boise time. Public appointment availability has been recalculated.`
          : `Added availability from ${fmtLocalInput(savedStart)} to ${fmtLocalInput(savedEnd)} Boise time.`,
      );
      setStartsAt("");
      setEndsAt("");
      setNote("");
      setImpact([]);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Override could not be added.");
    }
  }

  async function removeOverride(id: string) {
    setError("");
    setSaved("");
    try {
      const response = await fetch(`/api/admin/settings/availability/overrides/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message);
      setSaved("Override removed. Public appointment availability has been recalculated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Override could not be removed.");
    }
  }

  const canCheckImpact = kind === "unavailable" && startsAt && endsAt && !blockValidation && services.length > 0;
  const visibleImpact = canCheckImpact ? impact : [];
  const visibleImpactError = canCheckImpact ? impactError : "";
  const isCheckingImpact = Boolean(canCheckImpact) && checkingImpact;
  const affectedCount = visibleImpact.reduce((total, item) => total + item.slots.length, 0);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">STYLE WITH KAYLA</p>
          <h1>Availability settings</h1>
          <p>Times are shown in America/Boise · Signed in as {userName}</p>
        </div>
        <div className="admin-header-links">
          <a href="/admin">Appointment requests</a>
          <a href={signOutPath}>Sign out</a>
        </div>
      </header>

      {error && <p className="booking-error" role="alert">{error}</p>}
      {saved && <p className="admin-success" role="status">{saved}</p>}

      <section className="availability-card">
        <div className="availability-title">
          <div>
            <p className="small-label">ROUTINE WINDOWS</p>
            <h2>Weekly availability</h2>
          </div>
          <button className="primary-button" onClick={() => void saveRules()}>Save routine</button>
        </div>
        {days.map(([day, label]) => (
          <div className="availability-day" key={day}>
            <strong>{label}</strong>
            <div>
              {rules.filter(rule => rule.weekday === day).map((rule, index) => (
                <div className="window-row" key={`${day}-${index}`}>
                  <input aria-label={`${label} start`} type="time" value={asTime(rule.startMinute)} onChange={event => change(day, index, "startMinute", event.target.value)} />
                  <span>to</span>
                  <input aria-label={`${label} end`} type="time" value={asTime(rule.endMinute)} onChange={event => change(day, index, "endMinute", event.target.value)} />
                  <button onClick={() => removeWindow(day, index)}>Remove</button>
                </div>
              ))}
              <button className="add-window" onClick={() => addWindow(day)}>+ Add window</button>
            </div>
          </div>
        ))}
      </section>

      <section className="availability-card">
        <p className="small-label">ONE-OFF CHANGES</p>
        <h2>Availability overrides</h2>
        <p>Blocked time removes every public appointment that overlaps any part of the blocked period, including appointments that begin before the block and run into it.</p>

        <div className="override-form">
          <label>
            Type
            <select value={kind} onChange={event => setKind(event.target.value as typeof kind)}>
              <option value="unavailable">Block time</option>
              <option value="available">Add available time</option>
            </select>
          </label>
          <label>
            Starts
            <input type="datetime-local" step={900} value={startsAt} onChange={event => setStartsAt(snapDateTimeLocalToQuarterHour(event.target.value))} />
          </label>
          <label>
            Ends
            <input type="datetime-local" step={900} value={endsAt} onChange={event => setEndsAt(snapDateTimeLocalToQuarterHour(event.target.value))} />
          </label>
          <label className="wide">
            Note
            <input value={note} onChange={event => setNote(event.target.value)} />
          </label>
          <button className="primary-button" disabled={!startsAt || !endsAt || Boolean(blockValidation)} onClick={() => void addOverride()}>
            {kind === "unavailable" ? "Block time" : "Add available time"}
          </button>
        </div>

        {blockValidation && <p className="admin-warning" role="alert">{blockValidation}</p>}

        {startsAt && endsAt && !blockValidation && (
          <div className="availability-preview" aria-live="polite">
            <strong>{kind === "unavailable" ? "You are blocking" : "You are adding availability"}</strong>
            <p>{fmtLocalInput(startsAt)} to {fmtLocalInput(endsAt)} · Boise time</p>
          </div>
        )}

        {kind === "unavailable" && startsAt && endsAt && !blockValidation && (
          <div className="availability-impact" aria-live="polite">
            <strong>Affected public appointments</strong>
            {isCheckingImpact ? (
              <p>Checking current appointment availability…</p>
            ) : visibleImpactError ? (
              <p className="admin-warning">{visibleImpactError}</p>
            ) : affectedCount ? (
              <>
                <p>This block currently removes {affectedCount} available appointment {affectedCount === 1 ? "start" : "starts"} across {visibleImpact.length} {visibleImpact.length === 1 ? "service" : "services"}.</p>
                <div className="availability-impact-list">
                  {visibleImpact.map(item => (
                    <div key={item.serviceCode}>
                      <strong>{item.serviceName} · {item.durationMinutes} min</strong>
                      <p>{item.slots.map(slot => `${fmtTime(slot.startsAt)}–${fmtTime(slot.endsAt)}`).join(", ")}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>No currently available public appointments overlap this block.</p>
            )}
          </div>
        )}

        <div className="override-list">
          {overrides.length ? overrides.map(item => (
            <div key={item.id}>
              <span className={`status-pill ${item.kind}`}>{item.kind}</span>
              <p>
                <strong>{fmt(item.startsAt)}</strong> to <strong>{fmt(item.endsAt)}</strong>
                {item.note && <><br />{item.note}</>}
              </p>
              <button onClick={() => void removeOverride(item.id)}>Remove</button>
            </div>
          )) : <p>No upcoming overrides.</p>}
        </div>
      </section>

      <style>{`
        .availability-preview { margin-top: 18px; padding: 14px 16px; border: 1px solid var(--rose); border-radius: 8px; background: var(--blush); }
        .availability-preview p { margin: 5px 0 0; font-size: 15px; line-height: 1.45; }
        .availability-impact { margin-top: 18px; padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: rgba(246, 238, 235, 0.45); }
        .availability-impact > p { margin: 7px 0 0; }
        .availability-impact-list { display: grid; gap: 10px; margin-top: 12px; }
        .availability-impact-list > div { padding-top: 10px; border-top: 1px solid var(--line); }
        .availability-impact-list p { margin: 4px 0 0; font-size: 13px; line-height: 1.45; }
      `}</style>
    </main>
  );
}
