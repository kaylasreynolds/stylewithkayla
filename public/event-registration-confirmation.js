(() => {
  const dialog = document.querySelector("#rsvp-dialog");
  const form = document.querySelector("#rsvp-form");
  const message = document.querySelector("#rsvp-message");

  if (!dialog || !form || !message) return;

  let rendering = false;

  const escape = value =>
    String(value ?? "").replace(/[&<>"']/g, character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
    );

  const formatDate = (value, timezone) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: timezone || "America/Boise",
    }).format(new Date(value));

  const formatTime = (value, timezone) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || "America/Boise",
    }).format(new Date(value));

  const ornament = `
    <div class="rsvp-confirmation__ornament" aria-hidden="true">
      <span></span><i></i><span></span>
    </div>
  `;

  async function showConfirmation() {
    if (rendering || form.querySelector(".rsvp-confirmation")) return;
    if (!message.textContent?.trim().startsWith("You’re registered!")) return;

    rendering = true;

    const eventId = form.elements.eventId?.value;
    const appointmentSelect = form.elements.appointmentSlotId;
    const selectedAppointment = appointmentSelect?.selectedOptions?.[0]?.textContent?.trim() || "";

    let event = null;

    try {
      if (eventId) {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
          headers: { Accept: "application/json" },
        });
        const body = await response.json();
        if (response.ok) event = body.data?.event ?? null;
      }
    } catch {
      // The RSVP already succeeded. The confirmation screen can still render
      // with the information available in the form if this follow-up request fails.
    }

    const titleFromHeading = document
      .querySelector("#rsvp-title")
      ?.textContent
      ?.replace(/^Save My Spot\s*[—-]\s*/, "")
      .trim();

    const title = event?.title || titleFromHeading || "Your event";
    const timezone = event?.timezone || "America/Boise";
    const date = event?.startsAt ? formatDate(event.startsAt, timezone) : "Confirmed";
    const eventTime = event?.startsAt && event?.endsAt
      ? `${formatTime(event.startsAt, timezone)}–${formatTime(event.endsAt, timezone)}`
      : "";
    const appointment = selectedAppointment && !/^choose a time/i.test(selectedAppointment)
      ? selectedAppointment
      : eventTime;
    const location = [event?.location, event?.locationDetails].filter(Boolean).join(" · ");
    const offer = [event?.offer, event?.offerDetails].filter(Boolean).join(" — ");

    const confirmation = document.createElement("section");
    confirmation.className = "rsvp-confirmation";
    confirmation.setAttribute("aria-live", "polite");
    confirmation.innerHTML = `
      <div class="rsvp-confirmation__brand">
        <img src="/images/stylewithkayla_logo_white_transparent.png" alt="Style with Kayla">
      </div>

      <div class="rsvp-confirmation__hero">
        <p class="rsvp-confirmation__thank-you">Thank you!</p>
        <p class="rsvp-confirmation__status">Your appointment is confirmed</p>
      </div>

      <div class="rsvp-confirmation__intro">
        <p>I’m so excited you’ll be joining me for the</p>
        <h3>${escape(title)}</h3>
        <p>Your appointment is set, and all of the details are right here.</p>
      </div>

      ${ornament}

      <div class="rsvp-confirmation__details">
        <div class="rsvp-confirmation__row">
          <span>Event</span>
          <strong>${escape(title)}</strong>
        </div>
        <div class="rsvp-confirmation__row">
          <span>Date</span>
          <strong>${escape(date)}</strong>
        </div>
        ${appointment ? `
          <div class="rsvp-confirmation__row rsvp-confirmation__row--appointment">
            <span>Your appointment</span>
            <strong>${escape(appointment)}</strong>
          </div>
        ` : ""}
        ${location ? `
          <div class="rsvp-confirmation__row">
            <span>Location</span>
            <strong>${escape(location)}</strong>
          </div>
        ` : ""}
      </div>

      ${offer ? `
        <div class="rsvp-confirmation__perk">
          <div class="rsvp-confirmation__perk-icon" aria-hidden="true">♡</div>
          <div>
            <span>Appointment perk:</span>
            <p>${escape(offer)}</p>
          </div>
        </div>
      ` : ""}

      <div class="rsvp-confirmation__email-note">
        <strong>Check your confirmation email</strong>
        <p>Your full appointment details and calendar file have been sent to your inbox.</p>
      </div>

      ${ornament}

      <div class="rsvp-confirmation__closing">
        <p>I’ll see you there!</p>
        <img src="/images/heart-name-pink.png" alt="xo, Kayla">
      </div>

      <div class="rsvp-confirmation__help">
        <span aria-hidden="true">✉</span>
        <p><strong>Questions or changes?</strong><br>Reply to your confirmation email or contact me at <a href="mailto:kayla.reynolds@macys.com">kayla.reynolds@macys.com</a>.</p>
      </div>

      <button type="button" class="rsvp-confirmation__done">Done</button>
    `;

    form.classList.add("rsvp-form--confirmed");
    form.append(confirmation);

    confirmation.querySelector(".rsvp-confirmation__done")?.addEventListener("click", () => dialog.close());

    form.scrollTop = 0;
    confirmation.querySelector(".rsvp-confirmation__done")?.focus({ preventScroll: true });
    rendering = false;
  }

  new MutationObserver(() => {
    void showConfirmation();
  }).observe(message, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  dialog.addEventListener("close", () => {
    form.classList.remove("rsvp-form--confirmed");
    form.querySelector(".rsvp-confirmation")?.remove();
    rendering = false;
  });
})();
