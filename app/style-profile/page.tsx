"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

const steps = ["Your Goals", "Fit & Comfort", "Sizes & Silhouettes", "Final Details"];
const shoppingOptions = ["Everyday Outfits", "Workwear", "Event", "Vacation", "Other"];
const styleOptions = [
  ["Minimal", "Clean lines and simple details"],
  ["Statement", "Bold pieces that stand out"],
  ["Sporty", "Active, practical, and polished"],
  ["Casual", "Relaxed and easy to wear"],
  ["Trendy", "Current shapes and details"],
  ["Feminine", "Soft shapes and pretty details"],
];
const bodyShapes = [
  ["Hourglass", "Balanced shoulders and hips with a defined waist"],
  ["Pear", "Hips are fuller than shoulders"],
  ["Apple", "Fuller through the middle"],
  ["Rectangle", "Shoulders, waist, and hips are similar"],
  ["Inverted Triangle", "Shoulders are broader than hips"],
  ["Not sure", "We can figure this out together"],
];

function toggleLimited(current: string[], value: string, limit = 3) {
  if (current.includes(value)) return current.filter((item) => item !== value);
  return current.length < limit ? [...current, value] : current;
}

export default function StyleProfilePage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [shoppingFor, setShoppingFor] = useState<string[]>(["Everyday Outfits"]);
  const [styles, setStyles] = useState<string[]>([]);
  const [bodyShape, setBodyShape] = useState("");
  const [fitAreas, setFitAreas] = useState<string[]>([]);
  const [otherFit, setOtherFit] = useState("");
  const [details, setDetails] = useState("");
  const [sizes, setSizes] = useState({ top: "", pant: "", dress: "", shoe: "", bra: "" });

  if (submitted) {
    return <div className="site-shell"><Announcement /><Header /><main className="profile-complete"><span className="profile-complete-mark">✓</span><p className="eyebrow">STYLE PROFILE COMPLETE</p><h1>You&apos;re all set, Jamie.</h1><p>Kayla can now review your preferences and begin preparing for your appointment.</p><div className="confirmed-appointment"><span>CONFIRMED APPOINTMENT</span><strong>Women&apos;s Everyday Styling</strong><p>Thursday, July 16, 2026 · 10:30 AM<br />Macy&apos;s Boise Towne Square</p></div><Link className="button primary-button" href="/">Return to booking preview</Link></main><Footer /></div>;
  }

  return (
    <div className="site-shell">
      <Announcement /><Header />
      <main className="profile-page">
        <section className="profile-welcome">
          <p className="eyebrow">YOUR STYLE PROFILE</p>
          <h1>Hi, Jamie.</h1>
          <p>Tell me what feels like you, what does not, and what would make shopping easier. Your progress is saved as you go.</p>
          <div className="confirmed-appointment"><span>CONFIRMED APPOINTMENT</span><strong>Women&apos;s Everyday Styling</strong><p>Thursday, July 16, 2026 · 10:30 AM<br />Macy&apos;s Boise Towne Square</p><a href="mailto:kayla.reynolds@macys.com?subject=Appointment%20Details">Need to change something?</a></div>
        </section>

        <section className="profile-workspace">
          <div className="profile-progress" aria-label={`Style Profile step ${step} of 4`}>
            {steps.map((label, index) => <button key={label} className={step === index + 1 ? "active" : step > index + 1 ? "complete" : ""} onClick={() => setStep(index + 1)}><span>{step > index + 1 ? "✓" : index + 1}</span><strong>{label}</strong></button>)}
          </div>

          {step === 1 && <div className="profile-step">
            <p className="small-label">PART ONE OF FOUR</p><h2>Your styling goals</h2><p className="profile-step-intro">This gives me a feel for the life your clothes need to support.</p>
            <Question title="What are you shopping for?" hint={`${shoppingFor.length}/3 selected · Choose up to 3`}>
              <div className="answer-chips">{shoppingOptions.map((option) => <button key={option} className={shoppingFor.includes(option) ? "selected" : ""} onClick={() => setShoppingFor(toggleLimited(shoppingFor, option))}>{option}</button>)}</div>
            </Question>
            <Question title="Tell me a little more about what you need."><textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="For example: I need outfits that work for the office and still feel relaxed on weekends." /></Question>
            <Question title="Pick up to 3 styles that feel most like you." hint={`${styles.length}/3 selected`}>
              <div className="visual-answer-grid">{styleOptions.map(([name, description], index) => <button key={name} className={styles.includes(name) ? "selected" : ""} onClick={() => setStyles(toggleLimited(styles, name))}><span className={`style-swatch swatch-${index + 1}`} aria-hidden="true" /><strong>{name}</strong><small>{description}</small></button>)}</div>
            </Question>
            <Question title="Do you have inspiration photos, a Pinterest board, or colors you want me to see?" optional><input type="url" placeholder="Paste a link" /></Question>
          </div>}

          {step === 2 && <div className="profile-step">
            <p className="small-label">PART TWO OF FOUR</p><h2>Fit and comfort</h2><p className="profile-step-intro">There are no right answers here—this simply helps me pull better options.</p>
            <Question title="Which description most closely resembles your shape?">
              <div className="shape-grid">{bodyShapes.map(([name, description], index) => <button key={name} className={bodyShape === name ? "selected" : ""} onClick={() => setBodyShape(name)}><span className={`shape-symbol shape-${index + 1}`} aria-hidden="true" /><strong>{name}</strong><small>{description}</small></button>)}</div>
            </Question>
            <Question title="Which areas are usually most difficult to fit?" hint="Choose all that apply">
              <div className="answer-chips">{["Midsection", "Chest", "Hips", "Arms", "Length", "Other"].map((option) => <button key={option} className={fitAreas.includes(option) ? "selected" : ""} onClick={() => setFitAreas(toggleLimited(fitAreas, option, 6))}>{option}</button>)}</div>
              {fitAreas.includes("Other") && <input className="other-answer" aria-label="Describe another area that is difficult to fit" value={otherFit} onChange={(e) => setOtherFit(e.target.value)} placeholder="Tell me what is usually difficult to fit" autoFocus />}
            </Question>
            <div className="two-question-grid"><Question title="Which sizing department usually works best for you?"><select defaultValue=""><option value="" disabled>Select one</option><option>Regular</option><option>Petite</option><option>Plus</option><option>Tall / Long</option><option>Not sure</option></select></Question><Question title="What tends to feel best on your body?"><select defaultValue=""><option value="" disabled>Select one</option><option>Structured</option><option>Stretchy</option><option>A mix</option><option>Not sure / open to both</option></select></Question></div>
          </div>}

          {step === 3 && <div className="profile-step">
            <p className="small-label">PART THREE OF FOUR</p><h2>Sizes and silhouettes</h2><p className="profile-step-intro">Provide your best estimate for a starting point and we&apos;ll narrow it down from there.</p>
            <div className="size-grid">{[["top","Top size"],["pant","Pant size"],["dress","Dress size"],["shoe","Shoe size"]].map(([key,label]) => <label key={key}><span>{label} *</span><input value={sizes[key as keyof typeof sizes]} onChange={(e) => setSizes({...sizes,[key]:e.target.value})} placeholder="Enter Size(s)" /></label>)}</div>
            <Question title="How do you usually like your tops to fit?"><div className="answer-chips">{["More fitted", "Relaxed", "Oversized", "No preference"].map((option) => <button key={option}>{option}</button>)}</div></Question>
            <Question title="Which pant cuts do you prefer?" hint="Choose all that apply"><div className="answer-chips">{["Skinny", "Straight", "Bootcut", "Boyfriend / Girlfriend", "Wide Leg", "Open to trying different cuts"].map((option) => <button key={option}>{option}</button>)}</div></Question>
            <Question title="What bra size do you usually wear, if known?" optional><input value={sizes.bra} onChange={(e) => setSizes({...sizes,bra:e.target.value})} /></Question>
          </div>}

          {step === 4 && <div className="profile-step">
            <p className="small-label">PART FOUR OF FOUR</p><h2>Final details</h2><p className="profile-step-intro">A last chance to share anything that will help me make the appointment feel more like you.</p>
            <Question title="What styles, colors, or silhouettes do you feel best in?"><textarea rows={4} /></Question>
            <Question title="Are there any styles, colors, or pieces you do not want to wear?"><textarea rows={4} placeholder="‘Nothing specific’ is a perfectly good answer." /></Question>
            <Question title="Is there anything else you'd like me to know before our appointment?" optional><textarea rows={4} /></Question>
            <div className="profile-privacy"><strong>Your information stays private.</strong><p>It is used only to prepare for and manage your styling appointment. You can update this profile for 30 days after submitting it.</p></div>
          </div>}

          <div className="profile-actions"><button className="save-later">Save &amp; finish later</button><span>Saved just now</span><div>{step > 1 && <button className="text-button" onClick={() => setStep(step - 1)}>← Back</button>}{step < 4 ? <button className="button primary-button" onClick={() => setStep(step + 1)}>Continue</button> : <button className="button primary-button" onClick={() => setSubmitted(true)}>Submit Style Profile</button>}</div></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Question({ title, hint, optional, children }: { title: string; hint?: string; optional?: boolean; children: ReactNode }) {
  return <fieldset className="profile-question"><legend>{title} {optional && <em>Optional</em>}</legend>{hint && <p className="question-hint">{hint}</p>}{children}</fieldset>;
}

function Announcement() { return <div className="announcement-bar">Complimentary Personal Styling Appointments | 20% Off For First Time Clients*</div>; }
function Header() { return <header className="site-header"><div className="container header-inner"><Link className="site-logo" href="/" aria-label="Style with Kayla home"><img src="/images/stylewithkayla_logo.png" alt="Style with Kayla" /></Link><nav className="site-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#services">Services</Link><Link href="/#events">Events</Link><Link href="/#about">About Me</Link><a href="#contact">Contact</a></nav><Link className="button header-cta" href="/">BOOK APPOINTMENT</Link></div></header>; }
function Footer() { return <footer className="site-footer" id="contact"><div className="container footer-inner"><div className="footer-column footer-brand"><Link className="footer-logo" href="/"><img src="/images/stylewithkayla_logo.png" alt="Style with Kayla" /></Link></div><nav className="footer-column footer-links"><p className="footer-kicker">Quick Links</p><Link href="/#services">Services</Link><Link href="/#events">Events</Link><span className="footer-link--inactive">Guides</span><span className="footer-link--inactive">FAQ</span><Link href="/#about">About Me</Link></nav><div className="footer-column footer-contact"><p className="footer-kicker">Let&apos;s Connect</p><div className="footer-contact-item"><span><img src="/images/phone.png" alt="" /></span><a href="tel:+12088596427">208-859-6427</a></div><div className="footer-contact-item"><span><img src="/images/email.png" alt="" /></span><a href="mailto:kayla.reynolds@macys.com">kayla.reynolds@macys.com</a></div><div className="footer-contact-item"><span><img src="/images/location.png" alt="" /></span><p>Macy&apos;s Boise Towne Square<br />370 N. Milwaukee St.<br />Boise, ID 83704</p></div></div><div className="footer-column footer-social"><p className="footer-kicker">Follow Along</p><Link className="button button--primary" href="/">Book Appointment</Link></div></div><div className="container footer-bottom"><span>© 2026 Style with Kayla</span><span>|</span><span>Personal Stylist at Macy&apos;s</span><span>|</span><span>All Rights Reserved</span></div></footer>; }
