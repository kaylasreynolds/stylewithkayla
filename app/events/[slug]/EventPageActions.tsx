"use client";

import { FormEvent, useRef, useState } from "react";
import {
  isRegisterableEvent,
  registrationAvailability,
  type PublicRegistrationEvent,
} from "@/lib/event-rsvp-state";
import styles from "./event-page.module.css";

type EventData = Record<string, unknown> & PublicRegistrationEvent & {
  id?: unknown;
  slug?: unknown;
  ctaAction?: unknown;
  ctaLabel?: unknown;
};

const registrationActions = new Set([
  "registration",
  "appointment",
  "interest_list",
]);

export default function EventPageActions({
  event,
  isPast,
  currentTime,
}: {
  event: EventData;
  isPast: boolean;
  currentTime: number;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const [detail, setDetail] = useState<EventData | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [partySize, setPartySize] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const action = String(event.ctaAction || "none");
  const label = String(event.ctaLabel || "Learn More");

  const registrationAction =
    registrationActions.has(action) &&
    isRegisterableEvent(event);

  const availability = registrationAvailability(
    event,
    currentTime,
  );

  const slots = Array.isArray(detail?.appointmentSlots)
    ? (detail.appointmentSlots as Array<
        Record<string, unknown>
      >)
    : [];

  const appointmentRequired =
    Boolean(detail?.appointmentRequired);

  const appointmentRecommended =
    detail?.attendanceType ===
    "appointment_recommended";

  const requiredSlotsUnavailable =
    appointmentRequired &&
    slots.length === 0;

  const direct =
    action === "external_url"
      ? String(event.ctaUrl)
      : action === "email"
        ? `mailto:${event.ctaEmail}`
        : action === "phone"
          ? `tel:${event.ctaPhone}`
          : action === "add_to_calendar"
            ? `/api/events/${event.id}/calendar`
            : "";

  async function openRegistration() {
    if (availability.disabled) return;

    setMessage(
      "Loading registration options…",
    );

    dialog.current?.showModal();

    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(
          String(event.id),
        )}`,
      );

      const body = await response.json() as {
        data?: {
          event?: EventData;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        setMessage(
          body.error?.message ||
            "Registration options could not be loaded.",
        );
        return;
      }

      if (!body.data?.event) {
        setMessage(
          "Registration options could not be loaded.",
        );
        return;
      }
      setDetail(body.data.event);
      setMessage("");
    } catch {
      setMessage(
        "Registration options could not be loaded.",
      );
    }
  }

  async function submit(
    registrationForm: FormEvent<HTMLFormElement>,
  ) {
    registrationForm.preventDefault();

    if (requiredSlotsUnavailable) return;

    setSubmitting(true);
    setMessage("Saving your spot…");

    const data = new FormData(
      registrationForm.currentTarget,
    );

    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(
          String(event.id),
        )}/rsvps`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
            "idempotency-key":
              crypto.randomUUID(),
          },
          body: JSON.stringify({
            name: data.get("name"),
            email: data.get("email"),
            phone:
              data.get("phone") ||
              undefined,
            guestCount: Number(
              data.get("guestCount") || 0,
            ),
            notes:
              data.get("notes") ||
              undefined,
            appointmentSlotId:
              data.get(
                "appointmentSlotId",
              ) || undefined,
          }),
        },
      );

      const body = await response.json() as {
        data?: {
          registration?: {
            partySize?: number;
          };
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        setMessage(
          body.error?.message ||
            "We could not complete registration.",
        );
        return;
      }

      const savedPartySize =
        body.data?.registration?.partySize;
      if (typeof savedPartySize !== "number") {
        setMessage(
          "We could not complete registration.",
        );
        return;
      }

      setPartySize(savedPartySize);
      setMessage("");
        } catch {
      setMessage(
           "We could not complete registration.",
      );
        } finally {
      setSubmitting(false);
    }
  }

  function resetRegistration() {
    form.current?.reset();
    setDetail(null);
    setMessage("");
    setSubmitting(false);
    setPartySize(null);
  }

  async function copyUrl(url: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error(
      "Clipboard is not available.",
    );
  }

  await navigator.clipboard.writeText(
    url,
  );
}

  async function share() {
    const url = `${location.origin}/events/${event.slug}`;
    const text = String(
      event.shareMessage || "",
    );

    try {
      if (navigator.share) {
        await navigator.share({
          title: String(event.title),
          text,
          url,
        });
      } else {
        await copyUrl(url);
        setCopied(true);
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      await copyUrl(url);
      setCopied(true);
    }
  }

  const showPrimary =
    action !== "none" &&
    action !== "information" &&
    !isPast;

  return (
    <section
      className={styles.actions}
      aria-label="Event actions"
    >
      {registrationAction &&
        availability.message && (
          <p
            className={`${styles.availability} ${
              availability.disabled
                ? styles.unavailable
                : ""
            }`}
            role="status"
          >
            {availability.message}
          </p>
        )}

      {showPrimary &&
        (direct ? (
          <a
            className={styles.primary}
            href={direct}
          >
            {label}
          </a>
        ) : registrationAction ? (
          <button
            className={styles.primary}
            type="button"
            onClick={openRegistration}
            disabled={
              availability.disabled
            }
          >
            {availability.disabled
              ? availability.message
              : label}
          </button>
        ) : null)}

      <div
        className={styles.secondary}
      >
        <a
          href={`/api/events/${event.id}/calendar`}
        >
          Save to Calendar
        </a>

        {Boolean(
          event.sharingEnabled,
        ) && (
          <button
            type="button"
            onClick={share}
          >
            {copied
              ? "Link Copied"
              : "Share Event"}
          </button>
        )}
      </div>

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="event-rsvp-title"
        onClose={resetRegistration}
      >
        <form
          ref={form}
          onSubmit={submit}
        >
          <button
            className={styles.close}
            type="button"
            aria-label="Close registration"
            onClick={() =>
              dialog.current?.close()
            }
          >
            ×
          </button>

          {partySize !== null ? (
            <div
              className={styles.success}
            >
              <span aria-hidden="true">
                ✓
              </span>

              <h2 id="event-rsvp-title">
                You’re registered!
              </h2>

              <p>
                We saved {partySize} spot
                {partySize === 1
                  ? ""
                  : "s"}{" "}
                for{" "}
                {String(event.title)}.
              </p>

              <button
                className={
                  styles.primary
                }
                type="button"
                onClick={() =>
                  dialog.current?.close()
                }
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <h2 id="event-rsvp-title">
                {label} —{" "}
                {String(event.title)}
              </h2>

              {detail && (
                <div
                  className={
                    styles.form
                  }
                >
                  <label>
                    Name
                    <input
                      name="name"
                      required
                      maxLength={120}
                    />
                  </label>

                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      name="phone"
                      type="tel"
                      maxLength={40}
                    />
                  </label>

                  {Number(
                    detail.maxGuests,
                  ) > 0 && (
                    <label>
                      Number of guests
                      <input
                        name="guestCount"
                        type="number"
                        min="0"
                        max={Number(
                          detail.maxGuests,
                        )}
                        defaultValue="0"
                      />
                    </label>
                  )}

                  {(appointmentRequired ||
                    appointmentRecommended) &&
                    slots.length >
                      0 && (
                      <label>
                        Appointment time
                        <select
                          name="appointmentSlotId"
                          required={
                            appointmentRequired
                          }
                        >
                          <option value="">
                            {appointmentRequired
                              ? "Choose a time"
                              : "Choose a time (optional)"}
                          </option>

                          {slots.map(
                            slot => (
                              <option
                                key={String(
                                  slot.id,
                                )}
                                value={String(
                                  slot.id,
                                )}
                              >
                                {String(
                                  slot.label ||
                                    new Date(
                                      String(
                                        slot.startsAt,
                                      ),
                                    ).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "numeric",
                                        minute:
                                          "2-digit",
                                      },
                                    ),
                                )}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    )}

                  {requiredSlotsUnavailable && (
                    <p
                      className={
                        styles.unavailable
                      }
                      role="status"
                    >
                      No appointment
                      times are currently
                      available.
                    </p>
                  )}

                  {appointmentRecommended &&
                    slots.length ===
                      0 && (
                      <p
                        className={
                          styles.availability
                        }
                      >
                        Appointment times
                        are not currently
                        available. You can
                        still RSVP without
                        one.
                      </p>
                    )}

                  <label>
                    Notes
                    <textarea
                      name="notes"
                      maxLength={1000}
                    />
                  </label>

                  <button
                    className={
                      styles.primary
                    }
                    disabled={
                      submitting ||
                      requiredSlotsUnavailable
                    }
                  >
                    {submitting
                      ? "Saving…"
                      : label}
                  </button>
                </div>
              )}

              <p role="status">
                {message}
              </p>
            </>
          )}
        </form>
      </dialog>
    </section>
  );
  }