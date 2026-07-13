"use client";

import { useMemo, useState } from "react";

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

const services: Service[] = [
  { id: "women-event", audience: "Women", name: "Women's Event & Occasion Styling", shortName: "Event & Occasion Styling", duration: 60, isEvent: true, description: "A focused appointment for a wedding, celebration, work event, or special occasion." },
  { id: "women-everyday", audience: "Women", name: "Women's Everyday Styling", shortName: "Everyday Styling", duration: 90, needsAge: true, description: "Build polished outfits that feel natural for your day-to-day life." },
  { id: "women-closet", audience: "Women", name: "Women's Full Closet Refresh", shortName: "Full Closet Refresh", duration: 180, needsAge: true, description: "A more complete wardrobe update with time to compare and build full looks." },
  { id: "men-event", audience: "Men", name: "Men's Event & Occasion Styling", shortName: "Event & Occasion Styling", duration: 60, isEvent: true, description: "A complete event look built around the dress code, setting, and personal style." },
  { id: "men-everyday", audience: "Men", name: "Men's Everyday Styling", shortName: "Everyday Styling", duration: 90, description: "Practical, polished outfits for work, weekends, and everything in between." },
  { id: "men-closet", audience: "Men", name: "Men's Full Closet Refresh", shortName: "Full Closet Refresh", duration: 180, description: "A thoughtful wardrobe update with versatile pieces and complete outfits." },
];

const slotMap: Record<number, string[]> = {
  60: ["10:30 AM", "11:30 AM", "12:30 PM", "2:30 PM", "3:30 PM", "4:30 PM"],
  90: ["10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"],
  180: ["10:30 AM", "2:30 PM"],
};

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
  const demoToday = useMemo(() => new Date(2026, 6, 13, 12), []);
  const maxDate = useMemo(() => new Date(2026, 8, 11, 12), []);
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState<"Women" | "Men">("Women");
  const [serviceId, setServiceId] = useState("women-everyday");
  const [month, setMonth] = useState(new Date(2026, 6, 1));
  const [selectedDate, setSelectedDate] = useState("2026-07-16");
  const [selectedTime, setSelectedTime] = useState("10:30 AM");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    returning: "",
    heard: "",
    age: "",
    eventType: "",
    eventDate: "",
    notes: "",
    privacy: false,
  });

  const selectedService = services.find((service) => service.id === serviceId) ?? services[1];
  const visibleServices = services.filter((service) => service.audience === audience);
  const slots = slotMap[selectedService.duration];

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
      const weekday = date.getDay();
      const availableDay = weekday >= 2 && weekday <= 6;
      const earliest = new Date(demoToday);
      earliest.setDate(earliest.getDate() + 1);
      earliest.setHours(0, 0, 0, 0);
      const disabled = outside || !availableDay || date < earliest || date > maxDate;
      return { date, outside, disabled, key: keyForDate(date) };
    });
  }, [demoToday, maxDate, month]);

  function chooseService(id: string) {
    const next = services.find((service) => service.id === id);
    if (!next) return;
    setServiceId(id);
    setSelectedTime(slotMap[next.duration][0]);
  }

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitRequest() {
    setSubmitted(true);
  }

  function canContinue() {
    if (step === 1) return Boolean(serviceId);
    if (step === 2) return Boolean(selectedDate && selectedTime);
    if (step === 3) {
      const conditional = selectedService.needsAge ? Boolean(form.age) : selectedService.isEvent ? Boolean(form.eventType && form.eventDate) : true;
      return Boolean(form.name && form.email && form.phone && form.returning && conditional && form.privacy);
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
          <div className="next-steps">
            <div><span>1</span><p><strong>Kayla reviews your request</strong><br />Your selected time is held while it is pending.</p></div>
            <div><span>2</span><p><strong>You receive confirmation</strong><br />Or an alternate time if the request needs adjusting.</p></div>
            <div><span>3</span><p><strong>Complete your Style Profile</strong><br />Your private link arrives after the appointment is confirmed.</p></div>
          </div>
          <button className="button secondary-button" onClick={() => { setSubmitted(false); setStep(1); }}>Return to booking preview</button>
        </main>
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
                    <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
                    <h3>{monthNames[month.getMonth()]} {month.getFullYear()}</h3>
                    <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
                  </div>
                  <div className="weekday-row">{weekdayNames.map((day) => <span key={day}>{day}</span>)}</div>
                  <div className="calendar-grid">
                    {calendarDays.map(({ date, key, outside, disabled }) => (
                      <button key={key} disabled={disabled} className={`${outside ? "outside" : ""} ${selectedDate === key ? "selected" : ""}`} onClick={() => setSelectedDate(key)} aria-label={date.toDateString()}>
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
                    {slots.map((slot) => <button key={slot} className={selectedTime === slot ? "selected" : ""} onClick={() => setSelectedTime(slot)}>{selectedTime === slot && <span>✓</span>}{slot}</button>)}
                  </div>
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
                <fieldset className="full choice-field"><legend>Have we worked together before? *</legend><div>{["Yes", "No"].map((value) => <button type="button" className={form.returning === value ? "selected" : ""} key={value} onClick={() => updateField("returning", value)}>{value}</button>)}</div></fieldset>
                {form.returning === "No" && <label className="full"><span>How did you hear about me?</span><select value={form.heard} onChange={(e) => updateField("heard", e.target.value)}><option value="">Select one</option><option>Instagram</option><option>Facebook</option><option>In-store</option><option>Referral</option><option>{"Macy's event"}</option><option>Other</option></select></label>}
                {selectedService.needsAge && <fieldset className="full choice-field"><legend>Which age range applies to you? *</legend><div>{["Under 40", "40 or older", "Prefer not to answer"].map((value) => <button type="button" className={form.age === value ? "selected" : ""} key={value} onClick={() => updateField("age", value)}>{value}</button>)}</div></fieldset>}
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
                <div><span>Date & time</span><strong>{readableDate(selectedDate)}<br />{selectedTime}</strong><button type="button" onClick={() => setStep(2)}>Edit</button></div>
                <div><span>Contact</span><strong>{form.name}<br />{form.email}<br />{form.phone}</strong><button type="button" onClick={() => setStep(3)}>Edit</button></div>
                {selectedService.needsAge && <div><span>Style Profile routing</span><strong>{form.age}</strong><button type="button" onClick={() => setStep(3)}>Edit</button></div>}
              </div>
              <div className="pending-callout"><span>i</span><p><strong>This is an appointment request.</strong><br />Your selected time will be held while Kayla reviews it. You will receive a confirmation or an alternate-time option.</p></div>
            </form>
          )}

          <div className="workspace-actions">
            {step > 1 ? <button className="text-button" onClick={() => setStep(step - 1)}>← Back</button> : <span />}
            {step < 4 ? <button className="button primary-button" disabled={!canContinue()} onClick={() => setStep(step + 1)}>Continue</button> : <button className="button primary-button" type="button" onClick={submitRequest}>Submit Request</button>}
          </div>
        </section>
      </main>
      <footer><p>Style With Kayla · Macy&apos;s Boise Personal Stylist</p><p id="privacy">Complimentary personal styling · Appointment requests require confirmation</p></footer>
    </div>
  );
}

function Announcement() {
  return <div className="announcement">Complimentary personal styling at Macy&apos;s Boise</div>;
}

function Header() {
  return (
    <header className="site-header">
      <div className="brand"><span>STYLE WITH KAYLA</span><small>PERSONAL STYLIST</small></div>
      <nav aria-label="Main navigation"><a href="#services">Services</a><a href="#events">Events</a><a href="#guides">Guides</a><a href="#faq">FAQ</a><a href="#about">About Me</a><a href="#contact">Contact</a><a className="header-cta" href="#booking">Book an Appointment</a></nav>
    </header>
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
      <div><span className="summary-audience">{service.audience.toUpperCase()}</span><h3>{service.shortName}</h3><p>{service.duration} minutes · Complimentary</p>{selectedDate && <p className="summary-date">{readableDate(selectedDate)} · {selectedTime}</p>}</div>
      {onChange && <button onClick={onChange}>Change service →</button>}
    </div>
  );
}
