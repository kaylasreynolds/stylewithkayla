"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { sanitizeBookingNotes } from "@/lib/booking-notes";
import styles from "./single-date-booking.module.css";

type Audience = "Women" | "Men";
type Slot = { startsAt: string; endsAt: string; source: "routine_only" };
type ServiceKey = "event" | "everyday" | "seasonal" | "closet";
type ServiceOption = {
  key: ServiceKey;
  name: string;
  duration: number;
  description: string;
  icon: string;
  isEvent?: boolean;
};

const SERVICES: ServiceOption[] = [
  {
    key: "event",
    name: "Events and Occasions",
    duration: 60,
    icon: "✦",
    isEvent: true,
    description: "A focused appointment for a wedding, celebration, work event, or special occasion.",
  },
  {
    key: "everyday",
    name: "Everyday Styling",
    duration: 120,
    icon: "◇",
    description: "Build polished outfits that feel natural for your day-to-day life.",
  },
  {
    key: "seasonal",
    name: "Seasonal Update",
    duration: 120,
    icon: "⌁",
    description: "Update outfits for the season while maintaining what feels natural for your lifestyle.",
  },
  {
    key: "closet",
    name: "Full Closet Refresh",
    duration: 180,
    icon: "▦",
    description: "A more complete wardrobe update with time to compare and build full looks.",
  },
];

function serviceCode(audience: Audience, key: ServiceKey) {
  return `${audience === "Women" ? "women" : "men"}_${key === "event" ? "event" : key === "closet" ? "closet" : key}`;
}

function durationLabel(minutes: number) {
  if (minutes === 60) return "1 hr.";
  if (minutes % 60 === 0) return `${minutes / 60} hrs.`;
  return `${minutes} min.`;
}

function parseDateParam() {
  if (typeof window === "undefined") return "";
  const value = new URLSearchParams(window.location.search).get("date") ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function parseAudienceParam(): Audience {
  if (typeof window === "undefined") return "Women";
  return new URLSearchParams(window.location.search).get("audience")?.toLowerCase() === "men" ? "Men" : "Women";
}

function readableDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function shortDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(
    new Date(year, month - 1, day),
  );
}

function timeLabel(startsAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Boise",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

export default function SingleDateBookingPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [audience, setAudience] = useState<Audience>("Women");
  const [step, setStep] = useState(1);
  const [serviceKey, setServiceKey] = useState<ServiceKey>("everyday");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [publicReference, setPublicReference] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    returning: "",
    heard: "",
    eventType: "",
    eventDate: "",
    notes: "",
    privacy: false,
  });

  const selectedService = useMemo(() => SERVICES.find((service) => service.key === serviceKey) ?? SERVICES[1], [serviceKey]);
  const code = serviceCode(audience, serviceKey);

  useEffect(() => {
    setSelectedDate(parseDateParam());
    setAudience(parseAudienceParam());
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    setLoadingTimes(true);
    setBookingError("");
    setSelectedTime("");
    fetch(`/api/availability?serviceCode=${encodeURIComponent(code)}&from=${selectedDate}&to=${selectedDate}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as { data?: { slots?: Slot[] }; error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message || "Availability could not be loaded.");
        return payload.data?.slots ?? [];
      })
      .then((data) => setSlots(data.filter((slot) => slot.startsAt)))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSlots([]);
          setBookingError(error instanceof Error ? error.message : "Availability could not be loaded.");
        }
      })
      .finally(() => setLoadingTimes(false));
    return () => controller.abort();
  }, [code, selectedDate]);

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function canContinue() {
    if (step === 1) return Boolean(serviceKey);
    if (step === 2) return Boolean(selectedTime);
    if (step === 3) {
      const eventFields = selectedService.isEvent ? Boolean(form.eventType && form.eventDate) : true;
      return Boolean(
        form.name &&
          form.email &&
          form.phone &&
          form.returning &&
          (form.returning === "Yes" || form.heard) &&
          eventFields &&
          form.privacy,
      );
    }
    return true;
  }

  async function submitRequest() {
    if (submitting || !selectedTime) return;
    setSubmitting(true);
    setBookingError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current },
        body: JSON.stringify({
          serviceCode: code,
          requestedStartAt: selectedTime,
          client: { fullName: form.name, email: form.email, phone: form.phone },
          returningClient: form.returning === "Yes",
          howHeard: form.returning === "Yes" ? null : form.heard,
          eventType: selectedService.isEvent ? form.eventType : null,
          eventDate: selectedService.isEvent ? form.eventDate : null,
          bookingNotes: sanitizeBookingNotes(form.notes, form.phone),
          privacy: { policyVersion: "2026-07-13", acknowledged: form.privacy },
        }),
      });
      const payload = (await response.json()) as { data?: { publicReference?: string }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "Your request could not be submitted.");
      setPublicReference(payload.data?.publicReference ?? "");
      setSubmitted(true);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Your request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedDate) {
    return (
      <main className={styles.invalidWrap}>
        <div className={styles.invalidCard}>
          <div className={styles.wordmark}>STYLE <span>WITH KAYLA</span></div>
          <h1>This booking link needs a date.</h1>
          <p>Please use the date-specific link Kayla shared with you, or choose from all available appointments.</p>
          <Link className={styles.primaryButton} href="/book">View all appointments</Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <a href="https://stylewithkayla.com/index.html" className={styles.backLink}> ← Back to website </a>
          <div className={styles.wordmark}>STYLE <span>WITH KAYLA</span><em>Personal Stylist</em></div>
          <span />
        </header>
        <section className={styles.success}>
          <div className={styles.successMark}>✓</div>
          <p className={styles.kicker}>REQUEST RECEIVED</p>
          <h1>Your request is being reviewed.</h1>
          <p>Your request for <strong>{readableDate(selectedDate)}</strong> at <strong>{timeLabel(selectedTime)}</strong> has been sent to Kayla.</p>
          <div className={styles.reviewCard}>
            <div><span>Service</span><strong>{selectedService.name}</strong></div>
            <div><span>Date</span><strong>{readableDate(selectedDate)}</strong></div>
            <div><span>Time</span><strong>{timeLabel(selectedTime)}</strong></div>
          </div>
          {publicReference && <p className={styles.reference}>Request reference: <strong>{publicReference}</strong></p>}
          <Link className={styles.primaryButton} href="/">Return Home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>← Back</Link>
        <div className={styles.wordmark}>STYLE <span>WITH KAYLA</span><em>Personal Stylist</em></div>
        <span />
      </header>

      <section className={styles.dateBanner}>
        <div className={styles.calendarIcon}>▣</div>
        <div>
          <strong>Booking for {readableDate(selectedDate)}</strong>
          <span>Mountain Time (MT)</span>
        </div>
      </section>

      <section className={styles.content}>
        <Progress step={step} />
        <div className={styles.datePill}>▣ <span>{shortDate(selectedDate)}</span></div>

        {step === 1 && (
          <section className={styles.panel}>
            <h1>1. Choose Your Service</h1>
            <p className={styles.helper}>Choose the experience that best fits your needs.</p>
            <div className={styles.audienceToggle} aria-label="Styling department">
              {(["Women", "Men"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={audience === item ? styles.toggleActive : ""}
                  onClick={() => setAudience(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className={styles.serviceList}>
              {SERVICES.map((service) => {
                const selected = service.key === serviceKey;
                return (
                  <button
                    type="button"
                    key={service.key}
                    className={`${styles.serviceCard} ${selected ? styles.selectedCard : ""}`}
                    onClick={() => setServiceKey(service.key)}
                  >
                    <span className={styles.serviceIcon}>{service.icon}</span>
                    <span className={styles.serviceCopy}>
                      <strong>{service.name}</strong>
                      <b>{durationLabel(service.duration)}</b>
                      <span>{service.description}</span>
                    </span>
                    <span className={`${styles.radio} ${selected ? styles.radioSelected : ""}`}>{selected ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className={styles.panel}>
            <h1>2. Choose Your Time</h1>
            <p className={styles.helper}>Select an available appointment time for this day.</p>
            {loadingTimes ? (
              <div className={styles.emptyState}>Checking available times…</div>
            ) : slots.length ? (
              <div className={styles.timeList}>
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.startsAt}
                    className={selectedTime === slot.startsAt ? styles.timeSelected : ""}
                    onClick={() => setSelectedTime(slot.startsAt)}
                  >
                    <strong>{timeLabel(slot.startsAt)}</strong>
                    <span className={`${styles.radio} ${selectedTime === slot.startsAt ? styles.radioSelected : ""}`}>
                      {selectedTime === slot.startsAt ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No times are currently available for this service on this date.</div>
            )}
            <div className={styles.contactCard}>
              <span>Don’t see a time that works?</span>
              <a href="mailto:kayla@stylewithkayla.com">Let Kayla know →</a>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={styles.panel}>
            <h1>3. Your Details</h1>
            <p className={styles.helper}>Tell me how to reach you so I can review your request.</p>
            <div className={styles.formGrid}>
              <label><span>Full Name</span><input value={form.name} onChange={(event) => updateField("name", event.target.value)} /></label>
              <label><span>Email</span><input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} /></label>
              <label><span>Phone</span><input type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
              <label>
                <span>Have we worked together before?</span>
                <select value={form.returning} onChange={(event) => updateField("returning", event.target.value)}>
                  <option value="">Select one</option><option>Yes</option><option>No</option>
                </select>
              </label>
              {form.returning === "No" && (
                <label><span>How did you hear about me?</span><input value={form.heard} onChange={(event) => updateField("heard", event.target.value)} /></label>
              )}
              {selectedService.isEvent && (
                <>
                  <label><span>Event Type</span><input value={form.eventType} onChange={(event) => updateField("eventType", event.target.value)} /></label>
                  <label><span>Event Date</span><input type="date" value={form.eventDate} onChange={(event) => updateField("eventDate", event.target.value)} /></label>
                </>
              )}
              <label><span>Anything you'd like me to know? <em>Optional</em></span><textarea rows={4} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} /></label>
              <label className={styles.privacy}><input type="checkbox" checked={form.privacy} onChange={(event) => updateField("privacy", event.target.checked)} /><span>I acknowledge the privacy policy and consent to the use of these details to process my appointment request.</span></label>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className={styles.panel}>
            <h1>4. Review Your Request</h1>
            <p className={styles.helper}>Make sure everything looks right before submitting.</p>
            <div className={styles.reviewCard}>
              <div><span>Service</span><strong>{selectedService.name} · {durationLabel(selectedService.duration)}</strong><button type="button" onClick={() => setStep(1)}>Edit</button></div>
              <div><span>Date & Time</span><strong>{readableDate(selectedDate)} · {timeLabel(selectedTime)}</strong><button type="button" onClick={() => setStep(2)}>Edit</button></div>
              <div><span>Contact</span><strong>{form.name}<br />{form.email}<br />{form.phone}</strong><button type="button" onClick={() => setStep(3)}>Edit</button></div>
            </div>
            <div className={styles.pendingNote}>Your selected time will be held as pending while Kayla reviews your request.</div>
          </section>
        )}

        {bookingError && <div className={styles.error} role="alert">{bookingError}</div>}

        <footer className={styles.actions}>
          {step > 1 && <button type="button" className={styles.backButton} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>}
          {step < 4 ? (
            <button type="button" className={styles.primaryButton} disabled={!canContinue()} onClick={() => setStep((current) => Math.min(4, current + 1))}>Continue →</button>
          ) : (
            <button type="button" className={styles.primaryButton} disabled={submitting} onClick={submitRequest}>{submitting ? "Submitting…" : "Submit Request"}</button>
          )}
        </footer>
      </section>
    </main>
  );
}

function Progress({ step }: { step: number }) {
  const labels = ["SERVICE", "TIME", "DETAILS", "CONFIRM"];
  return (
    <div className={styles.progress} aria-label={`Step ${step} of 4`}>
      {labels.map((label, index) => {
        const number = index + 1;
        const complete = number < step;
        const active = number === step;
        return (
          <div key={label} className={active ? styles.progressActive : complete ? styles.progressComplete : ""}>
            <span>{complete ? "✓" : number}</span>
            <b>{label}</b>
          </div>
        );
      })}
    </div>
  );
}
