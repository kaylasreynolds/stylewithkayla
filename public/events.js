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
    };
  };

  const attendanceLabel = value => {
    const labels = {
      open_attendance: "Stop By Anytime",
      appointment_required: "Appointment Required",
      appointment_recommended: "Appointment Recommended",
      general_rsvp: "RSVP",
      interest_list: "Join the Interest List",
      invitation_only: "Invitation Only",
      information_only: "Information Only",
      drop_in: "Stop By Anytime",
    };

    return labels[value] ?? String(value ?? "").replaceAll("_", " ");
  };

  const eventDay = event =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: event.timezone || "America/Boise",
    }).format(new Date(event.startsAt));

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

  const calendarEscape = value =>
    String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const calendarDate = value =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const safeCalendarFilename = title => {
    const filename = String(title || "event")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .trim();

    return `${filename || "event"}.ics`;
  };

  function downloadCalendar(event) {
    const description =
      event.description || event.shortDescription || "";

    const location = [
      event.location,
      event.locationDetails,
    ]
      .filter(Boolean)
      .join(", ");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "PRODID:-//Style with Kayla//Events//EN",
      "BEGIN:VEVENT",
      `UID:${calendarEscape(event.id)}@stylewithkayla.com`,
      `DTSTAMP:${calendarDate(new Date())}`,
      `DTSTART:${calendarDate(event.startsAt)}`,
      `DTEND:${calendarDate(event.endsAt)}`,
      `SUMMARY:${calendarEscape(event.title)}`,
      `DESCRIPTION:${calendarEscape(description)}`,
      `LOCATION:${calendarEscape(location)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");

    const blob = new Blob([ics], {
      type: "text/calendar;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = safeCalendarFilename(event.title);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

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

    const isCalendar =
      event.ctaAction === "add_to_calendar";

    const registerable = [
      "appointment_required",
      "appointment_recommended",
      "general_rsvp",
      "interest_list",
    ].includes(event.attendanceType);

    const destination =
      event.ctaAction === "external_url"
        ? event.ctaUrl
        : event.ctaAction === "email"
          ? `mailto:${event.ctaEmail}`
          : event.ctaAction === "phone"
            ? `tel:${event.ctaPhone}`
            : null;

    const availability = registerable
      ? `
        <p class="event-card__availability">
          <span aria-hidden="true">${full ? "●" : "✓"}</span>
          ${
            full
              ? "Event full"
              : event.unlimitedCapacity
                ? "Space available"
                : `${event.spotsRemaining} spot${
                    event.spotsRemaining === 1 ? "" : "s"
                  } available`
          }
        </p>
      `
      : "";

    let cta = "";

    if (event.ctaAction !== "none") {
      if (destination) {
        cta = `
          <a
            class="button button--primary"
            href="${escape(destination)}"
          >
            ${escape(event.ctaLabel || "Learn More")}
          </a>
        `;
      } else {
        const buttonClass = registerable
          ? "event-rsvp"
          : isCalendar
            ? "event-calendar"
            : "";

        const buttonLabel =
          registerable && full
            ? "Event Full"
            : event.ctaLabel ||
              (isCalendar
                ? "Save to Calendar"
                : "Learn More");

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
            <div>
              <dt>Time</dt>
              <dd>
                <span class="event-fact-line">
                  ${escape(eventDay(event))}
                </span>

                <span class="event-fact-line">
                  ${escape(
                    event.allDay
                      ? "All day"
                      : eventTime(event),
                  )}
                </span>
              </dd>
            </div>

            <div>
              <dt>Location</dt>
              <dd>${escape(event.location)}</dd>
            </div>

            <div>
              <dt>Attendance</dt>
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

          ${availability}
          ${cta}
        </div>
      </article>
    `;
  }

  function updatesCard() {
    return `
      <article class="event-card event-card--updates">
        <div class="event-card__media event-card__updates-media" aria-hidden="true">
          <span class="event-card__updates-mark">SK</span>
        </div>
        <div class="event-card__content">
          <h3>More events coming soon</h3>
          <p class="event-card__description">
            Request updates and be the first to hear about new in-store events and styling experiences.
          </p>
          <a
            class="button button--primary event-card__cta"
            href="mailto:kayla.reynolds@macys.com?subject=Request%20Event%20Updates"
          >Request Event Updates</a>
        </div>
      </article>
    `;
  }

  list.addEventListener("click", event => {
    const button =
      event.target.closest(".event-calendar");

    if (!button) return;

    const item = events.find(
      eventItem =>
        String(eventItem.id) ===
        String(button.dataset.eventId),
    );

    if (!item) {
      console.error(
        "The selected event could not be found.",
      );
      return;
    }

    downloadCalendar(item);
  });

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
