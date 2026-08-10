(() => {
  const list = document.querySelector("#events-list");
  const empty = document.querySelector("#events-empty");
  const status = document.querySelector("#events-status");

  const dialog = document.querySelector("#rsvp-dialog");
  const form = document.querySelector("#rsvp-form");
  const message = document.querySelector("#rsvp-message");

  let events = [];

  const escape = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      char =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );

  const dateParts = iso => {
    const date = new Date(iso);

    return {
      month: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "America/Boise",
      }).format(date),

      day: new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        timeZone: "America/Boise",
      }).format(date),
      weekday: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "America/Boise",
      }).format(date),
    };
  };

  const attendanceLabel = value => {
    const labels = {
      open_attendance: "Stop by anytime",
      appointment_required: "Appointment required",
      appointment_recommended: "Appointment recommended",
      general_rsvp: "RSVP",
      interest_list: "Join the interest list",
      invitation_only: "Invitation only",
      information_only: "Information only",
      drop_in: "Stop by anytime",
    };

    return labels[value] ?? String(value ?? "");
  };

  const eventDay = event => {
    const parts = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "numeric",
      day: "numeric",
      year: "2-digit",
      timeZone: event.timezone || "America/Boise",
    }).formatToParts(new Date(event.startsAt));
    const value = type => parts.find(part => part.type === type)?.value || "";

    return `${value("weekday")} ${value("month")}/${value("day")}/${value("year")}`;
  };

  const eventTime = event => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: event.timezone || "America/Boise",
    });

    return `${formatter.format(
      new Date(event.startsAt),
    )}–${formatter.format(new Date(event.endsAt))}`;
  };

  const googleCalendarDate = (value, allDay) => {
    const date = new Date(value);

    return allDay
      ? date.toISOString().slice(0, 10).replace(/-/g, "")
      : date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  };

  const googleCalendarUrl = event => {
    const parameters = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title || "Style with Kayla event",
      dates: `${googleCalendarDate(event.startsAt, event.allDay)}/${googleCalendarDate(event.endsAt, event.allDay)}`,
      details: event.description || event.shortDescription || "",
      location: [event.location, event.locationDetails].filter(Boolean).join(", "),
    });

    return `https://calendar.google.com/calendar/render?${parameters}`;
  };

  async function load() {
    try {
      const response = await fetch("/api/events", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Events request failed with status ${response.status}.`,
        );
      }

      const body = await response.json();
      events = body.data?.events ?? [];

      status.hidden = true;
      empty.hidden = events.length !== 0;
      list.innerHTML = [
        ...events.map(card),
        ...(events.length === 2 ? [updatesCard()] : []),
      ].join("");
    } catch (error) {
      console.error(error);

      status.hidden = false;
      status.textContent =
        "Upcoming events could not be loaded. Please try again later.";
      status.classList.add("events-load-status--error");
    }
  }

  function card(event) {
    const date = dateParts(event.startsAt);
    const full =
      !event.unlimitedCapacity &&
      Number(event.spotsRemaining) < 1;
    const registerable = [
      "appointment_required",
      "appointment_recommended",
      "general_rsvp",
      "interest_list",
    ].includes(event.attendanceType);
    const registrationClosed =
      registerable &&
      event.registrationClosesAt &&
      new Date(event.registrationClosesAt).getTime() <= Date.now();
    const limited =
      registerable &&
      !full &&
      !registrationClosed &&
      !event.unlimitedCapacity &&
      Number(event.spotsRemaining) <= 5;

    const destination =
      event.ctaAction === "external_url"
        ? event.ctaUrl
        : event.ctaAction === "email"
          ? `mailto:${event.ctaEmail}`
          : event.ctaAction === "phone"
            ? `tel:${event.ctaPhone}`
            : event.ctaAction === "add_to_calendar"
              ? googleCalendarUrl(event)
              : null;

    const availabilityText = registrationClosed
      ? "Registration closed"
      : full
        ? "Event full"
        : limited
          ? `${event.spotsRemaining} spot${event.spotsRemaining === 1 ? "" : "s"} remaining`
          : "";
    const urgentAvailability = full || registrationClosed
      ? `
        <p class="event-card__availability event-card__availability--urgent"><span aria-hidden="true">●</span> ${availabilityText}</p>
      `
      : "";
    const limitedAvailability = limited
      ? `<p class="event-card__availability"><span aria-hidden="true">●</span> ${availabilityText}</p>`
      : "";

    let cta = "";

    if (event.ctaAction !== "none") {
      if (destination) {
        cta = `
          <a
            class="button button--primary"
            href="${escape(destination)}"
            ${event.ctaAction === "add_to_calendar" ? "download" : ""}
          >
            ${escape(
              event.ctaLabel ||
                (event.ctaAction === "add_to_calendar"
                  ? "Save to Calendar"
                  : "Learn More"),
            )}
          </a>
        `;
      } else {
        const buttonClass = registerable ? "event-rsvp" : "";

        const buttonLabel =
          registerable && full
            ? "Event Full"
            : event.ctaLabel || "Learn More";

        cta = `
          <button
            type="button"
            class="button button--primary ${buttonClass}"
            data-event-id="${escape(event.id)}"
            ${registerable && full ? "disabled" : ""}
          >
            ${escape(buttonLabel)}
          </button>
        `;
      }
    }

    return `
      <article class="event-card">
        <div class="event-card__media">
          ${
            event.imageUrl
              ? `
                <img
                  src="${escape(event.imageUrl)}"
                  alt="${escape(event.imageAlt || "")}"
                >
              `
              : `
                <div
                  class="event-card__placeholder"
                  aria-hidden="true"
                ></div>
              `
          }

          <div class="event-date">
            <span>${escape(date.month)}</span>
            <strong>${escape(date.day)}</strong>
            <span>${escape(date.weekday)}</span>
          </div>
        </div>

        <div class="event-card__content">
          <h3>${escape(event.title)}</h3>

          <p class="event-card__description">
            ${escape(
              event.shortDescription ||
                event.description,
            )}
          </p>

          <dl class="event-facts">
            <div class="event-fact">
              <dt class="sr-only">Time</dt>
              <span class="event-fact__icon" aria-hidden="true"><img src="/images/store-event.png" alt="Time" /></span>
              <dd>
                ${escape(eventDay(event))} · ${escape(
                    event.allDay
                      ? "All day"
                      : eventTime(event),
                  )}
              </dd>
            </div>
            <div class="event-fact">
              <dt class="sr-only">Location</dt>
              <span class="event-fact__icon" aria-hidden="true"><img src="/images/store-location.png" alt="Location" /></span>
              <dd>${escape(event.location)}</dd>
            </div>
            <div class="event-fact">
              <dt class="sr-only">Attendance</dt>
              <span class="event-fact__icon" aria-hidden="true"><img src="/images/style-together.png" alt="Attendance" /></span>
              <dd>
                ${escape(
                  attendanceLabel(
                    event.attendanceType,
                  ),
                )}
              </dd>
            </div>
          </dl>

          ${
            event.offer
              ? `
                <p class="event-card__offer">
                  <strong>${escape(event.offer)}</strong>
                </p>
              `
              : ""
          }

          ${limitedAvailability}
          ${urgentAvailability}
          ${cta}
        </div>
      </article>
    `;
  }

  function updatesCard() {
    return `
      <article class="event-card event-card--updates">
        <div class="event-card__media event-card__updates-media" aria-hidden="true">
          <span class="event-card__updates-mark"><svg viewBox="0 0 72 72"><rect x="14" y="18" width="44" height="40" rx="5"/><path d="M23 12v12M49 12v12M14 30h44"/><path d="M36 49s-10-5.7-10-12a5.5 5.5 0 0 1 10-3.5A5.5 5.5 0 0 1 46 37c0 6.3-10 12-10 12Z"/></svg></span>
        </div>
        <div class="event-card__content">
          <h3>More events coming soon</h3>
          <p class="event-card__description">
            Request updates and be the first to hear about upcoming in-store events and styling experiences.
          </p>
          <a
            class="button button--primary event-card__cta"
            href="mailto:kayla.reynolds@macys.com?subject=Request%20Event%20Updates"
          >Request Event Updates</a>
        </div>
      </article>
    `;
  }

  list.addEventListener("click", async event => {
    const button =
      event.target.closest(".event-rsvp");

    if (!button) return;

    message.textContent =
      "Loading registration options…";

    dialog.showModal();

    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(
          button.dataset.eventId,
        )}`,
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body.error?.message ||
            "Registration options could not be loaded.",
        );
      }

      const item = body.data.event;

      form.elements.eventId.value = item.id;

      document.querySelector(
        "#rsvp-title",
      ).textContent = `Save My Spot — ${item.title}`;

      const guests =
        document.querySelector("#guests-field");

      guests.hidden = item.maxGuests === 0;

      guests.querySelector(
        "small",
      ).textContent = `Up to ${item.maxGuests} guest${
        item.maxGuests === 1 ? "" : "s"
      }.`;

      const appointment =
        document.querySelector(
          "#appointment-field",
        );

      const select =
        form.elements.appointmentSlotId;

      appointment.hidden =
        !item.appointmentRequired;

      select.required =
        item.appointmentRequired;

      select.innerHTML = `
        <option value="">Choose a time</option>
        ${item.appointmentSlots
          .map(
            slot => `
              <option value="${escape(slot.id)}">
                ${escape(
                  slot.label ||
                    new Date(
                      slot.startsAt,
                    ).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    }),
                )}
              </option>
            `,
          )
          .join("")}
      `;

      message.textContent =
        item.appointmentRequired &&
        !item.appointmentSlots.length
          ? "No appointment times are currently available."
          : "";

      form.querySelector(
        '[type="submit"]',
      ).disabled =
        item.appointmentRequired &&
        !item.appointmentSlots.length;
    } catch (error) {
      message.textContent =
        error instanceof Error
          ? error.message
          : "Registration options could not be loaded.";
    }
  });

  dialog
    .querySelector(".rsvp-dialog__close")
    .addEventListener("click", () => {
      dialog.close();
    });

  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const submit = form.querySelector(
        '[type="submit"]',
      );

      submit.disabled = true;
      message.textContent =
        "Saving your spot…";

      const values = new FormData(form);

      const payload = {
        name: values.get("name"),
        email: values.get("email"),
        phone:
          values.get("phone") || undefined,
        notes:
          values.get("notes") || undefined,
        guestNames: String(
          values.get("guestNames") || "",
        )
          .split(/\n/)
          .map(value => value.trim())
          .filter(Boolean),
        appointmentSlotId:
          values.get("appointmentSlotId") ||
          undefined,
      };

      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(
            values.get("eventId"),
          )}/rsvps`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "Idempotency-Key":
                crypto.randomUUID(),
            },
            body: JSON.stringify(payload),
          },
        );

        const body = await response.json();

        if (!response.ok) {
          throw new Error(
            body.error?.message ||
              "We could not complete registration.",
          );
        }

        form.querySelector(
          ".rsvp-form__fields",
        ).hidden = true;

        submit.hidden = true;

        message.textContent = `You’re registered! We saved ${
          body.data.registration.partySize
        } spot${
          body.data.registration.partySize === 1
            ? ""
            : "s"
        }.`;

        load();
      } catch (error) {
        message.textContent =
          error instanceof Error
            ? error.message
            : "We could not complete registration.";

        submit.disabled = false;
      }
    },
  );

  dialog.addEventListener("close", () => {
    form.reset();

    form.querySelector(
      ".rsvp-form__fields",
    ).hidden = false;

    const submit = form.querySelector(
      '[type="submit"]',
    );

    submit.hidden = false;
    submit.disabled = false;
    message.textContent = "";
  });

  load();
})();
