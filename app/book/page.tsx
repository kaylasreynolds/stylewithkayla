"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Service = {
  id: string;
  audience: "Women" | "Men";
  name: string;
  shortName: string;
  duration: number;
  description: string;
  needsAge?: boolean;
  isEvent?: boolean;
};

const servicePresentation: Service[] = [
  { id: "women_event", audience: "Women", name: "Women's Event & Occasion Styling", shortName: "Event & Occasion Styling", duration: 60, isEvent: true, description: "A focused appointment for a wedding, celebration, work event, or special occasion." },
  { id: "women_everyday", audience: "Women", name: "Women's Everyday Styling", shortName: "Everyday Styling", duration: 90, description: "Build polished outfits that feel natural for your day-to-day life." },
  { id: "women_closet", audience: "Women", name: "Women's Full Closet Refresh", shortName: "Full Closet Refresh", duration: 180, description: "A more complete wardrobe update with time to compare and build full looks." },
  { id: "men_event", audience: "Men", name: "Men's Event & Occasion Styling", shortName: "Event & Occasion Styling", duration: 60, isEvent: true, description: "A complete event look built around the dress code, setting, and personal style." },
  { id: "men_everyday", audience: "Men", name: "Men's Everyday Styling", shortName: "Everyday Styling", duration: 90, description: "Practical, polished outfits for work, weekends, and everything in between." },
  { id: "men_closet", audience: "Men", name: "Men's Full Closet Refresh", shortName: "Full Closet Refresh", duration: 180, description: "A thoughtful wardrobe update with versatile pieces and complete outfits." },
];
type Slot = { startsAt: string; endsAt: string; source: "routine_only" };

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function keyForDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readableDate(value: string) {
  if (!value) return "Not selected";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

export default function Home() {
  const today = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => { const value = new Date(today); value.setDate(value.getDate() + 60); return value; }, [today]);
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState<"Women" | "Men">("Women");
  const [services, setServices] = useState(servicePresentation);
  const [serviceId, setServiceId] = useState("women_everyday");
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [loadingTimes, setLoadingTimes] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publicReference, setPublicReference] = useState("");
  const [submitted, setSubmitted] = useState(false);
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

  const selectedService = services.find((service) => service.id === serviceId) ?? services[1];
  const visibleServices = services.filter((service) => service.audience === audience);
  const slots = slotsByDate[selectedDate] ?? [];

  useEffect(() => {
    fetch("/api/services", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error();
      const payload = await response.json() as { data: { services: Array<{ code: string; name: string; durationMinutes: number }> } };
      setServices(servicePresentation.map(presentation => { const stored = payload.data.services.find(item => item.code === presentation.id); return stored ? { ...presentation, name: stored.name, duration: stored.durationMinutes } : presentation; }));
    }).catch(() => setBookingError("Services could not be refreshed. Please try again."));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const from = dateKeyInBoise(today), to = dateKeyInBoise(maxDate);
    Promise.resolve().then(() => { setLoadingTimes(true); setBookingError(""); return fetch(`/api/availability?serviceCode=${encodeURIComponent(serviceId)}&from=${from}&to=${to}`, { cache: "no-store", signal: controller.signal }); })
      .then(async response => { const payload = await response.json() as {data:{slots:Slot[]};error?:{message?:string}}; if (!response.ok) throw new Error(payload.error?.message || "Availability could not be loaded."); return payload.data; })
      .then(data => {
        const grouped = data.slots.reduce<Record<string, Slot[]>>((result, slot) => { const key = dateKeyInBoise(new Date(slot.startsAt)); (result[key] ||= []).push(slot); return result; }, {});
        setSlotsByDate(grouped);
        const firstDate = Object.keys(grouped).sort()[0] || "";
        setSelectedDate(current => grouped[current]?.length ? current : firstDate);
        setSelectedTime(current => data.slots.some(slot => slot.startsAt === current) ? current : (grouped[firstDate]?.[0]?.startsAt || ""));
      }).catch(error => { if (error.name !== "AbortError") { setSlotsByDate({}); setSelectedDate(""); setSelectedTime(""); setBookingError(error.message); } }).finally(() => setLoadingTimes(false));
    return () => controller.abort();
  }, [serviceId, today, maxDate]);

  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const previousMonthDays = new Date(year, monthIndex, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const dayOffset = index - firstDay + 1;
      let date: Date;
      let outside = false;
      if (dayOffset < 1) {
        date = new Date(year, monthIndex - 1, previousMonthDays + dayOffset);
        outside = true;
      } else if (dayOffset > daysInMonth) {
        date = new Date(year, monthIndex + 1, dayOffset - daysInMonth);
        outside = true;
      } else {
        date = new Date(year, monthIndex, dayOffset);
      }
      const disabled = outside || !slotsByDate[keyForDate(date)]?.length;
      return { date, outside, disabled, key: keyForDate(date) };
    });
  }, [month, slotsByDate]);

  function chooseService(id: string) {
    const next = services.find((service) => service.id === id);
    if (!next) return;
    setServiceId(id);
    setSelectedDate(""); setSelectedTime("");
  }

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitRequest() {
    if (submitting) return;
    setSubmitting(true); setBookingError("");
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current }, body: JSON.stringify({
        serviceCode: serviceId, requestedStartAt: selectedTime, client: { fullName: form.name, email: form.email, phone: form.phone },
        returningClient: form.returning === "Yes", howHeard: form.returning === "Yes" ? null : form.heard,
        eventType: selectedService.isEvent ? form.eventType : null, eventDate: selectedService.isEvent ? form.eventDate : null,
        bookingNotes: form.notes || null, privacy: { policyVersion: "2026-07-13", acknowledged: form.privacy },
      }) });
      const payload = await response.json() as {data:{publicReference:string};error?:{message?:string}}; if (!response.ok) throw new Error(payload.error?.message || "Your request could not be submitted.");
      setPublicReference(payload.data.publicReference); setSubmitted(true);
    } catch (error) { setBookingError(error instanceof Error ? error.message : "Your request could not be submitted."); }
    finally { setSubmitting(false); }
  }

  function canContinue() {
    if (step === 1) return Boolean(serviceId);
    if (step === 2) return Boolean(selectedDate && selectedTime);
    if (step === 3) {
      const conditional = selectedService.isEvent ? Boolean(form.eventType && form.eventDate) : true;
      return Boolean(form.name && form.email && form.phone && form.returning && (form.returning === "Yes" || form.heard) && conditional && form.privacy);
    }
    return true;
  }

  if (submitted) {
    return (
      <div className="site-shell">
        <Announcement />
        <Header />
        <main className="success-wrap">
          <div className="success-mark">✓</div>
          <p className="eyebrow">REQUEST RECEIVED</p>
          <h1>Thank you, {form.name.split(" ")[0] || "there"}.</h1>
          <p className="success-lead">Your appointment is pending until Kayla reviews and confirms it.</p>
          <div className="success-card">
            <Summary service={selectedService} selectedDate={selectedDate} selectedTime={selectedTime} compact />
          </div>
          <p className="request-reference">Request reference: <strong>{publicReference}</strong></p>
          <div className="next-steps">
            <div><span>1</span><p><strong>Kayla reviews your request</strong><br />Your selected time is held while it is pending.</p></div>
            <div><span>2</span><p><strong>You receive confirmation</strong><br />Or an alternate time if the request needs adjusting.</p></div>
            <div><span>3</span><p><strong>Complete your Style Profile</strong><br />Your private link arrives after the appointment is confirmed.</p></div>
          </div>
          <div className="success-actions">
            <button className="button secondary-button" onClick={() => { setSubmitted(false); setStep(1); }}>Return to booking preview</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-shell">
      <Announcement />
      <Header />
      <main className="booking-page">
        <aside className="booking-intro">
          <p className="eyebrow">BOOK YOUR APPOINTMENT</p>
          <h1>{step === 1 ? "Choose the support that fits." : step === 2 ? "Let's find a time that works for you." : step === 3 ? "Tell me how to reach you." : "Review your request."}</h1>
          <div className="pink-rule" />
          <p className="intro-copy">
            {step === 1 && "Select the service that best matches what you need. Every appointment is complimentary and personalized."}
            {step === 2 && "Choose an available date and time. Your appointment will be held as pending until I review your request."}
            {step === 3 && "A few details help me confirm your request and send the correct Style Profile after approval."}
            {step === 4 && "Make sure everything looks right before submitting. Your selected time will be held while I review it."}
          </p>
          <div className="desktop-summary">
            <Summary service={selectedService} selectedDate={step >= 2 ? selectedDate : ""} selectedTime={step >= 2 ? selectedTime : ""} onChange={() => setStep(1)} />
          </div>
        </aside>

        <section className="booking-workspace" aria-live="polite">
          <Progress step={step} />
          <div className="mobile-summary">
            <Summary service={selectedService} selectedDate={step >= 2 ? selectedDate : ""} selectedTime={step >= 2 ? selectedTime : ""} onChange={() => setStep(1)} compact />
          </div>

          {step === 1 && (
            <div className="step-panel">
              <div className="section-heading-row">
                <div><p className="small-label">STEP ONE</p><h2>Select a service</h2></div>
                <div className="audience-toggle" aria-label="Styling department">
                  {(["Women", "Men"] as const).map((item) => (
                    <button key={item} className={audience === item ? "active" : ""} onClick={() => { setAudience(item); chooseService(item === "Women" ? "women-everyday" : "men-everyday"); }}>{item}</button>
                  ))}
                </div>
              </div>
              <div className="service-grid">
                {visibleServices.map((service) => (
                  <button key={service.id} className={`service-option ${serviceId === service.id ? "selected" : ""}`} onClick={() => chooseService(service.id)}>
                    <span className="selection-dot" />
                    <span className="service-type">{service.shortName}</span>
                    <span className="service-duration">{service.duration} minutes</span>
                    <span className="service-description">{service.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-panel">
              <p className="small-label">STEP TWO</p>
              <h2>Select a date and time</h2>
              <div className="calendar-layout">
                <div className="calendar-panel">
                  <div className="month-control">
                    <button aria-label="Previous month" disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
                    <h3>{monthNames[month.getMonth()]} {month.getFullYear()}</h3>
                    <button aria-label="Next month" disabled={month >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
                  </div>
                  <div className="weekday-row">{weekdayNames.map((day) => <span key={day}>{day}</span>)}</div>
                  <div className="calendar-grid">
                    {calendarDays.map(({ date, key, outside, disabled }) => (
                      <button key={key} disabled={disabled} className={`${outside ? "outside" : ""} ${selectedDate === key ? "selected" : ""}`} onClick={() => { setSelectedDate(key); setSelectedTime(slotsByDate[key]?.[0]?.startsAt || ""); }} aria-label={date.toDateString()}>
                        {date.getDate()}
                      </button>
                    ))}
                  </div>
                  <p className="availability-note"><span /> Available Tuesday–Saturday, 24+ hours ahead</p>
                </div>
                <div className="time-panel">
                  <h3>Available times</h3>
                  <p>{readableDate(selectedDate)}</p>
                  <div className="time-list">
                    {loadingTimes ? <p className="loading-times">Checking routine availability…</p> : slots.length ? slots.map((slot) => <button key={slot.startsAt} className={selectedTime === slot.startsAt ? "selected" : ""} onClick={() => setSelectedTime(slot.startsAt)}>{selectedTime === slot.startsAt && <span>✓</span>}{timeInBoise(slot.startsAt)}</button>) : <p className="loading-times">No routine times are available for this date.</p>}
                  </div>
                  <p className="time-contact">Don&apos;t see a time that works? <a href="mailto:kayla.reynolds@macys.com?subject=Appointment%20Time%20Request">Send me a message.</a></p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <form className="step-panel details-form" onSubmit={(event) => event.preventDefault()}>
              <p className="small-label">STEP THREE</p>
              <h2>Your details</h2>
              <div className="form-grid">
                <label className="full"><span>Full name *</span><input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="First and last name" /></label>
                <label><span>Email address *</span><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" /></label>
                <label><span>Phone number *</span><input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(208) 555-0123" /></label>
                <div className="profile-details-row full">
                  <fieldset className="choice-field detail-group"><legend>Have we worked together before? *</legend><div>{["Yes", "No"].map((value) => <button type="button" className={form.returning === value ? "selected" : ""} key={value} onClick={() => updateField("returning", value)}>{value}</button>)}</div></fieldset>
                </div>
                {form.returning === "No" && <label className="full"><span>How did you hear about me?</span><select value={form.heard} onChange={(e) => updateField("heard", e.target.value)}><option value="">Select one</option><option>Instagram</option><option>Facebook</option><option>In-store</option><option>Referral</option><option>{"Macy's event"}</option><option>Other</option></select></label>}
                {selectedService.isEvent && <><label><span>What type of event? *</span><select value={form.eventType} onChange={(e) => updateField("eventType", e.target.value)}><option value="">Select one</option><option>Wedding Guest</option><option>Wedding Party</option><option>Business Event</option><option>Gala or Formal Event</option><option>School Dance</option><option>Other</option></select></label><label><span>When is the event? *</span><input type="date" value={form.eventDate} onChange={(e) => updateField("eventDate", e.target.value)} /></label></>}
                <label className="full"><span>Anything helpful for me to know?</span><textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Optional" rows={3} /></label>
                <label className="privacy-check full"><input type="checkbox" checked={form.privacy} onChange={(e) => updateField("privacy", e.target.checked)} /><span>I understand my information will be used to manage and prepare for my appointment. <a href="#privacy">Privacy details</a></span></label>
              </div>
            </form>
          )}

          {step === 4 && (
            <form className="step-panel review-panel" onSubmit={(event) => { event.preventDefault(); submitRequest(); }}>
              <p className="small-label">STEP FOUR</p>
              <h2>Review your request</h2>
              <div className="review-list">
                <div><span>Service</span><strong>{selectedService.name}</strong><button type="button" onClick={() => setStep(1)}>Edit</button></div>
                <div><span>Date & time</span><strong>{readableDate(selectedDate)}<br />{timeInBoise(selectedTime)}</strong><button type="button" onClick={() => setStep(2)}>Edit</button></div>
                <div><span>Contact</span><strong>{form.name}<br />{form.email}<br />{form.phone}</strong><button type="button" onClick={() => setStep(3)}>Edit</button></div>
              </div>
              <div className="pending-callout"><span>i</span><p><strong>This is an appointment request.</strong><br />Your selected time will be held while Kayla reviews it. You will receive a confirmation or an alternate-time option.</p></div>
            </form>
          )}

          {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
          <div className="workspace-actions">
            {step > 1 ? <button className="text-button" onClick={() => setStep(step - 1)}>← Back</button> : <span />}
            {step < 4 ? <button className="button primary-button" disabled={!canContinue()} onClick={() => setStep(step + 1)}>Continue</button> : <button className="button primary-button" type="button" disabled={submitting} onClick={submitRequest}>{submitting ? "Submitting…" : "Submit Request"}</button>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Announcement() {
  return <div className="announcement-bar">Complimentary Personal Styling Appointments | 20% Off For First Time Clients*</div>;
}

function Header() {
  return (
    <header className="site-header" aria-label="Site header">
      <div className="container header-inner">
        <a className="site-logo" href="#top" aria-label="Style with Kayla home"><img src="/images/stylewithkayla_logo.png" alt="Style with Kayla" /></a>
        <nav className="site-nav" aria-label="Main navigation"><a href="#top">Home</a><a href="#services">Services</a><a href="#events">Events</a><a href="#about">About Me</a><a href="#contact">Contact</a></nav>
        <a className="button header-cta" href="/book">BOOK APPOINTMENT</a>
      </div>
    </header>
  );
}

function Footer() {
  const socialIcons = ["instagram", "facebook", "pinterest", "linkedin"];
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-inner">
        <div className="footer-column footer-brand"><a className="footer-logo" href="#top" aria-label="Style with Kayla home"><img src="/images/stylewithkayla_logo.png" alt="Style with Kayla" /></a></div>
        <nav className="footer-column footer-links" aria-label="Footer quick links">
          <p className="footer-kicker">Quick Links</p><a href="#services">Services</a><a href="#events">Events</a><span className="footer-link--inactive" aria-disabled="true">Guides</span><span className="footer-link--inactive" aria-disabled="true">FAQ</span><a href="#about">About Me</a><a href="#contact">Contact</a>
        </nav>
        <div className="footer-column footer-contact">
          <p className="footer-kicker">Let&apos;s Connect</p>
          <div className="footer-contact-item"><span aria-hidden="true"><img src="/images/phone.png" alt="" /></span><a href="tel:+12088596427">208-859-6427</a></div>
          <div className="footer-contact-item"><span aria-hidden="true"><img src="/images/email.png" alt="" /></span><a href="mailto:kayla.reynolds@macys.com">kayla.reynolds@macys.com</a></div>
          <div className="footer-contact-item"><span aria-hidden="true"><img src="/images/location.png" alt="" /></span><p>Macy&apos;s Boise Towne Square<br />370 N. Milwaukee St.<br />Boise, ID 83704</p></div>
        </div>
        <div className="footer-column footer-social">
          <p className="footer-kicker">Follow Along</p>
          <div className="footer-social-links" aria-label="Social profiles">{socialIcons.map((icon) => <span className="footer-social-icon" role="img" aria-label={icon[0].toUpperCase() + icon.slice(1)} key={icon}><img src={`/images/${icon}.png`} alt="" aria-hidden="true" /></span>)}</div>
          <a className="button button--primary" href="/book">Book Appointment</a>
        </div>
      </div>
      <div className="container privacy-notice" id="privacy"><p className="footer-kicker">Privacy details</p><p>Your information is used only to review, manage, and prepare for your styling appointment. A pending request holds the selected time until Kayla confirms, declines, releases, or replaces it. Confirmed clients receive a private Style Profile link that expires 30 days after issue. Written booking and profile history is retained for two years after the most recent completed appointment. Contact Kayla to request access, correction, or deletion.</p></div>
      <div className="container footer-bottom"><span>&copy; 2026 Style with Kayla</span><span aria-hidden="true">|</span><span>Personal Stylist at Macy&apos;s</span><span aria-hidden="true">|</span><span>All Rights Reserved</span></div>
    </footer>
  );
}

function Progress({ step }: { step: number }) {
  const labels = ["Service", "Date & Time", "Your Details", "Review"];
  return <div className="progress" aria-label={`Step ${step} of 4`}>{labels.map((label, index) => <div className={step === index + 1 ? "active" : step > index + 1 ? "complete" : ""} key={label}><span>{step > index + 1 ? "✓" : index + 1}</span><p>{label}</p>{index < labels.length - 1 && <i />}</div>)}</div>;
}

function Summary({ service, selectedDate, selectedTime, onChange, compact = false }: { service: Service; selectedDate: string; selectedTime: string; onChange?: () => void; compact?: boolean }) {
  return (
    <div className={`appointment-summary ${compact ? "compact" : ""}`}>
      <div className="summary-icon">⌑</div>
      <div><span className="summary-audience">{service.audience.toUpperCase()}</span><h3>{service.shortName}</h3><p>{service.duration} minutes · Complimentary</p>{selectedDate && <p className="summary-date">{readableDate(selectedDate)} · {timeInBoise(selectedTime)}</p>}</div>
      {onChange && <button onClick={onChange}>Change service →</button>}
    </div>
  );
}

function dateKeyInBoise(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Boise", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function timeInBoise(value: string) {
  if (!value) return "Not selected";
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Boise", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
