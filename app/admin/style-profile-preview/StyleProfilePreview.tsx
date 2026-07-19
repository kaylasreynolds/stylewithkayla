"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  isQuestionVisible,
  isSectionVisible,
  resetAnswersForAgeRange,
} from "@/lib/profile-visibility";
import type {
  ProfileQuestion,
  ProfileSection,
} from "@/lib/server/profile-policy";

type Props = {
  schemas: Record<string, ProfileSection[]>;
  userName: string;
  signOutPath: string;
};

type PreviewState = {
  answers: Record<string, unknown>;
  currentSection: number;
  returningClient: boolean;
};

const STORAGE_PREFIX = "swk-style-profile-preview:";

const profileLabels: Record<string, string> = {
  under_40: "Women under 40",
  over_40: "Women 40 or older",
  womens_styling: "Women’s styling",
  womens_event: "Women’s event",
  mens_styling: "Men’s styling",
  mens_event: "Men’s event",
};

export default function StyleProfilePreview({
  schemas,
  userName,
  signOutPath,
}: Props) {
  const profileTypes = Object.keys(schemas);
  const [profileType, setProfileType] = useState(profileTypes[0] || "under_40");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [step, setStep] = useState(1);
  const [returningClient, setReturningClient] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const storageKey = `${STORAGE_PREFIX}${profileType}`;
  const schema = schemas[profileType] || [];
  const visibleSections = useMemo(
    () => schema.filter(section => isSectionVisible(section, answers)),
    [schema, answers],
  );
  const safeStep = Math.min(Math.max(step, 1), visibleSections.length || 1);
  const section = visibleSections[safeStep - 1];

  useEffect(() => {
    setHydrated(false);
    const raw = window.localStorage.getItem(storageKey);

    if (raw) {
      try {
        const saved = JSON.parse(raw) as PreviewState;
        setAnswers(saved.answers || {});
        setStep(saved.currentSection || 1);
        setReturningClient(Boolean(saved.returningClient));
      } catch {
        setAnswers({});
        setStep(1);
        setReturningClient(false);
      }
    } else {
      setAnswers({});
      setStep(1);
      setReturningClient(false);
    }

    setSavedAt("");
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;

    const timeout = window.setTimeout(() => {
      const state: PreviewState = {
        answers,
        currentSection: safeStep,
        returningClient,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [answers, hydrated, returningClient, safeStep, storageKey]);

  function updateAnswer(key: string, value: unknown) {
    setAnswers(current =>
      key === "age_range" && current.age_range !== value
        ? resetAnswersForAgeRange(current, value)
        : { ...current, [key]: value },
    );
  }

  function toggleAnswer(question: ProfileQuestion, value: string) {
    const current = Array.isArray(answers[question.key])
      ? (answers[question.key] as string[])
      : [];
    const next = current.includes(value)
      ? current.filter(item => item !== value)
      : current.length < (question.maxSelections ?? 99)
        ? [...current, value]
        : current;
    updateAnswer(question.key, next);
  }

  function resetPreview() {
    window.localStorage.removeItem(storageKey);
    setAnswers({});
    setStep(1);
    setReturningClient(false);
    setSavedAt("");
  }

  const visibleQuestions = section
    ? section.questions.filter(question =>
        isQuestionVisible(question, answers, returningClient),
      )
    : [];

  return (
    <main className="admin-shell profile-preview-admin">
      <header className="admin-header">
        <div>
          <p className="eyebrow">STYLE WITH KAYLA</p>
          <h1>Style Profile preview</h1>
          <p>Signed in as {userName}</p>
        </div>
        <div className="admin-header-links">
          <Link href="/admin">Appointment requests</Link>
          <Link href="/admin/availability">Manage availability</Link>
          <Link href="/admin/privacy">Privacy operations</Link>
          <a href={signOutPath}>Sign out</a>
        </div>
      </header>

      <section className="action-panel profile-preview-toolbar">
        <div>
          <h2>Live development workspace</h2>
          <p>
            This uses the current Style Profile questions and production styling. Test answers
            stay in this browser and never enter a client record.
          </p>
        </div>
        <label>
          Profile route
          <select value={profileType} onChange={event => setProfileType(event.target.value)}>
            {profileTypes.map(type => (
              <option key={type} value={type}>
                {profileLabels[type] || type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-preview-checkbox">
          <input
            type="checkbox"
            checked={returningClient}
            onChange={event => setReturningClient(event.target.checked)}
          />
          Preview as returning client
        </label>
        <div className="profile-preview-status" role="status" aria-live="polite">
          {savedAt ? `Test progress autosaved at ${savedAt}` : "Changes autosave automatically"}
        </div>
        <button className="danger" type="button" onClick={resetPreview}>
          Reset preview answers
        </button>
      </section>

      <div className="site-shell profile-preview-frame">
        <div className="announcement-bar">
          Complimentary Personal Styling Appointments | 20% Off For First Time Clients*
        </div>
        <header className="site-header">
          <div className="container header-inner">
            <Link className="site-logo" href="/" aria-label="Style with Kayla home">
              <img src="/images/stylewithkayla_logo.png" alt="Style with Kayla" />
            </Link>
            <nav className="site-nav" aria-label="Preview navigation">
              <span>Home</span>
              <span>Services</span>
              <span>Events</span>
              <span>About Me</span>
              <span>Contact</span>
            </nav>
            <span className="button header-cta">BOOK APPOINTMENT</span>
          </div>
        </header>

        <main className="profile-page">
          <section className="profile-welcome">
            <p className="eyebrow">YOUR STYLE PROFILE</p>
            <h1>Hi, Preview Client.</h1>
            <p>
              Tell me what feels like you, what does not, and what would make shopping easier.
              Your progress is saved as you go.
            </p>
            <div className="confirmed-appointment">
              <span>CONFIRMED APPOINTMENT</span>
              <strong>{profileLabels[profileType] || "Personal Styling"}</strong>
              <p>
                Saturday, August 1, 2026 at 11:00 AM
                <br />
                Macy&apos;s Boise Towne Square
              </p>
              <div className="calendar-options">
                <span>Download calendar file</span>
                <span>Add to Google Calendar</span>
              </div>
              <span>Need to change something?</span>
            </div>
          </section>

          <section className="profile-workspace">
            <div
              className="profile-progress"
              aria-label={`Style Profile section ${safeStep} of ${visibleSections.length}`}
            >
              {visibleSections.map((item, index) => (
                <button
                  type="button"
                  key={item.title}
                  className={safeStep === index + 1 ? "active" : safeStep > index + 1 ? "complete" : ""}
                  onClick={() => setStep(index + 1)}
                >
                  <span>{safeStep > index + 1 ? "✓" : index + 1}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>

            {section ? (
              <div className="profile-step">
                <p className="small-label">
                  PART {safeStep} OF {visibleSections.length}
                </p>
                <h2>{section.title}</h2>
                <p className="profile-step-intro">{section.intro}</p>
                {visibleQuestions.map((question, index) => (
                  <PreviewField
                    key={question.key}
                    question={question}
                    value={answers[question.key]}
                    index={index}
                    onChange={value => updateAnswer(question.key, value)}
                    onToggle={value => toggleAnswer(question, value)}
                  />
                ))}
              </div>
            ) : (
              <div className="profile-step">
                <h2>No visible sections</h2>
                <p>Reset the preview or choose another profile route.</p>
              </div>
            )}

            <div className="profile-privacy">
              <strong>Your information stays private.</strong>
              <p>
                It is used only to prepare for and manage your styling appointment. This link
                expires 30 days after it is issued.
              </p>
            </div>

            <div className="profile-actions">
              <button className="save-later" type="button">
                Save &amp; finish later
              </button>
              <span>{savedAt ? "Progress saved" : ""}</span>
              <div>
                {safeStep > 1 && (
                  <button className="text-button" type="button" onClick={() => setStep(safeStep - 1)}>
                    ← Back
                  </button>
                )}
                {safeStep < visibleSections.length ? (
                  <button
                    className="button primary-button"
                    type="button"
                    onClick={() => setStep(safeStep + 1)}
                  >
                    Continue
                  </button>
                ) : (
                  <button className="button primary-button" type="button">
                    Submit Style Profile
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </main>
  );
}

function PreviewField({
  question,
  value,
  index,
  onChange,
  onToggle,
}: {
  question: ProfileQuestion;
  value: unknown;
  index: number;
  onChange: (value: unknown) => void;
  onToggle: (value: string) => void;
}) {
  const label = (
    <>
      {question.label} {question.required && <span aria-hidden="true">*</span>}
      {question.optional && <em>Optional</em>}
    </>
  );

  if (question.kind === "long_text") {
    return (
      <fieldset className="profile-question">
        <legend>{label}</legend>
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          placeholder={question.placeholder}
        />
      </fieldset>
    );
  }

  if (question.kind === "text" || question.kind === "link" || question.kind === "date") {
    return (
      <fieldset className="profile-question">
        <legend>{label}</legend>
        <input
          type={question.kind === "link" ? "url" : question.kind === "date" ? "date" : "text"}
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          placeholder={question.placeholder}
        />
      </fieldset>
    );
  }

  if (question.kind === "single") {
    return (
      <fieldset className="profile-question">
        <legend>{label}</legend>
        <select
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
        >
          <option value="">Select one</option>
          {question.options?.map(option => <option key={option}>{option}</option>)}
        </select>
      </fieldset>
    );
  }

  const selected = Array.isArray(value) ? (value as string[]) : [];
  const single = question.kind === "visual_single";
  const visual = single || question.kind === "visual_multi";
  const shape = question.key === "body_shape";

  return (
    <fieldset className="profile-question">
      <legend>{label}</legend>
      {question.maxSelections && (
        <p className="question-hint">
          {selected.length}/{question.maxSelections} selected · Choose up to {question.maxSelections}
        </p>
      )}
      <div className={shape ? "shape-grid" : visual ? "visual-answer-grid" : "answer-chips"}>
        {question.options?.map((option, optionIndex) => {
          const active = single ? value === option : selected.includes(option);
          return (
            <button
              type="button"
              aria-pressed={active}
              key={option}
              className={active ? "selected" : ""}
              onClick={() => (single ? onChange(option) : onToggle(option))}
            >
              {visual && (
                <span
                  className={
                    shape
                      ? `shape-symbol shape-${optionIndex + 1}`
                      : `style-swatch swatch-${(index + optionIndex) % 6 + 1}`
                  }
                  aria-hidden="true"
                />
              )}
              <strong>{option}</strong>
              {visual && <small>{visualDescription(question.key, option)}</small>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function visualDescription(key: string, option: string) {
  const shapes: Record<string, string> = {
    Hourglass: "Balanced shoulders and hips with a defined waist",
    Pear: "Hips are fuller than shoulders",
    Apple: "Fuller through the middle",
    Rectangle: "Shoulders, waist, and hips are similar",
    "Inverted Triangle": "Shoulders are broader than hips",
    "Not sure": "Kayla can help determine the best fit direction",
  };

  return key === "body_shape" ? shapes[option] || option : `${option} visual style direction`;
}
