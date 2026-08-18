"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Booking = {
  status: string;
  clientFirstName: string;
  serviceName: string;
  serviceCode: string;
  requestedStartAt: string;
  proposedStartAt: string;
  proposedEndAt: string;
};

type Slot = { startsAt: string; endsAt: string };
type Mode = "choice" | "another" | "confirmed" | "pending" | "cancelled";

export default function ClientActionsPage() {
  return <ClientActionClient />;
}

export function ClientActionClient({ token }: { token?: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [mode, setMode] = useState<Mode>("choice");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/client-actions/${token}`, { cache: "no-store", referrerPolicy: "no-referrer" })
      .then(async response => {
        const payload = await response.json() as { data?: { booking: Booking }; error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message || "This private link is unavailable.");
        return payload.data!.booking;
      })
      .then(current => { setBooking(current); if (current.status === "cancelled") setMode("cancelled"); })
      .catch(current => setError(current instanceof Error ? current.message : "This private link is unavailable."))
      .finally(() => setLoading(false));
  }, [token]);

  async function accept() {
    if (!token) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/client-actions/${token}/accept-proposed-time`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        referrerPolicy: "no-referrer",
      });
      const payload = await response.json() as { data?: { profileAccessUrl: string }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "The proposed time could not be accepted.");
      setProfileLink(payload.data!.profileAccessUrl);
      setMode("confirmed");
    } catch (current) {
      setError(current instanceof Error ? current.message : "The proposed time could not be accepted.");
    } finally {
      setWorking(false);
    }
  }

  async function decline() {
    if (!token || !window.confirm("Decline this proposed appointment time and cancel the request?")) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/client-actions/${token}/decline-proposed-time`, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ reason: "Client declined the proposed appointment time." }),
      });
      const payload = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "The proposed time could not be declined.");
      setMode("cancelled");
    } catch (current) {
      setError(current instanceof Error ? current.message : "The proposed time could not be declined.");
    } finally {
      setWorking(false);
    }
  }

  async function chooseAnother() {
    if (!booking) return;
    setMode("another");
    setWorking(true);
    setError("");
    try {
      const from = dateKey(new Date());
      const end = new Date();
      end.setDate(end.getDate() + 60);
      const response = await fetch(`/api/availability?serviceCode=${encodeURIComponent(booking.serviceCode)}&from=${from}&to=${dateKey(end)}`, { cache: "no-store" });
      const payload = await response.json() as { data?: { slots: Slot[] }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "Availability could not be loaded.");
      setSlots(payload.data!.slots);
      setSelected(payload.data!.slots[0]?.startsAt || "");
    } catch (current) {
      setError(current instanceof Error ? current.message : "Availability could not be loaded.");
    } finally {
      setWorking(false);
    }
  }

  async function requestAnother() {
    if (!token || !selected) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/client-actions/${token}/request-another-time`, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ requestedStartAt: selected }),
      });
      const payload = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "The new time could not be requested.");
      setMode("pending");
    } catch (current) {
      setError(current instanceof Error ? current.message : "The new time could not be requested.");
    } finally {
      setWorking(false);
    }
  }

  if (!token) return <ActionShell><h1>Private link required.</h1><p>Please use the alternate-time link from Kayla.</p></ActionShell>;
  if (loading) return <ActionShell><p>Loading your appointment options…</p></ActionShell>;
  if (!booking) return <ActionShell><h1>Link unavailable.</h1><p>{error}</p></ActionShell>;
  if (mode === "confirmed") return <ActionShell><p className="eyebrow">APPOINTMENT CONFIRMED</p><h1>That time is yours.</h1><p>Your appointment is confirmed for {format(booking.proposedStartAt)}.</p><Link className="button primary-button" href={profileLink}>Complete your Style Profile</Link></ActionShell>;
  if (mode === "pending") return <ActionShell><p className="eyebrow">NEW TIME REQUESTED</p><h1>Thank you.</h1><p>Your new selection is pending while Kayla reviews it. The time is held in the meantime.</p></ActionShell>;
  if (mode === "cancelled") return <ActionShell><p className="eyebrow">REQUEST CANCELLED</p><h1>The proposed time was declined.</h1><p>Your appointment request is cancelled and the proposed time has been released.</p></ActionShell>;

  return <ActionShell>
    <p className="eyebrow">APPOINTMENT TIME</p>
    <h1>Hi, {booking.clientFirstName}.</h1>
    <p>Kayla proposed a different time for your {booking.serviceName} appointment.</p>
    <div className="proposed-time"><span>PROPOSED TIME</span><strong>{format(booking.proposedStartAt)}</strong><p>Macy&apos;s Boise Towne Square</p></div>
    {error && <p className="booking-error" role="alert">{error}</p>}
    {mode === "another" ? <div className="another-time">
      <label>Choose another available time<select value={selected} onChange={event => setSelected(event.target.value)}>{slots.map(slot => <option value={slot.startsAt} key={slot.startsAt}>{format(slot.startsAt)}</option>)}</select></label>
      {!working && !slots.length && <p>No routine times are currently available. Please contact Kayla.</p>}
      <div><button className="text-button" onClick={() => setMode("choice")}>Back</button><button className="button primary-button" disabled={!selected || working} onClick={() => void requestAnother()}>Request this time</button></div>
    </div> : <div className="client-action-buttons">
      <button className="button primary-button" disabled={working} onClick={() => void accept()}>Accept proposed time</button>
      <button className="button secondary-button" disabled={working} onClick={() => void chooseAnother()}>Request another time</button>
      <button className="button secondary-button" disabled={working} onClick={() => void decline()}>Decline and cancel request</button>
    </div>}
  </ActionShell>;
}

function ActionShell({ children }: { children: React.ReactNode }) {
  return <div className="site-shell client-action-shell"><header className="site-header"><div className="container header-inner"><Link className="site-logo" href="/">
    <Image src="/images/stylewithkayla_logo.png" alt="Style with Kayla" width={184} height={52} priority unoptimized />
  </Link></div></header><main className="client-action-page">{children}</main></div>;
}

function format(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Boise", weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function dateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Boise", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
