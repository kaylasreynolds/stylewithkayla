(() => {
  const list = document.querySelector("#events-list");
  if (!list) return;

  const escape = value =>
    String(value ?? "").replace(/[&<>"']/g, character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
    );

  const formatDateTime = event => {
    if (!event?.startsAt) return "";
    const timezone = event.timezone || "America/Boise";
    const date = new Intl.DateTimeFormat("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: timezone,
    }).format(new Date(event.startsAt));
    if (event.allDay) return `${date} · All day`;
    const time = value => new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", timeZone: timezone,
    }).format(new Date(value));
    return `${date} · ${time(event.startsAt)}–${time(event.endsAt)}`;
  };

  const attendanceLabel = value => ({
    open_attendance: "Stop by anytime",
    appointment_required: "Appointment required",
    appointment_recommended: "Appointment recommended",
    general_rsvp: "RSVP required",
    interest_list: "Join the interest list",
    invitation_only: "Invitation only",
    information_only: "Information only",
    drop_in: "Stop by anytime",
  })[value] || "";

  const paragraphMarkup = value =>
    String(value || "").trim().split(/\n\s*\n/)
      .map(paragraph => `<p>${escape(paragraph.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");

  let eventData = null;
  let enhancementPending = false;
  let lastTrigger = null;
  let activePrimaryAction = null;

  const loadEventData = async () => {
    if (eventData) return eventData;
    try {
      const response = await fetch("/api/events", { headers: { Accept: "application/json" } });
      if (!response.ok) return [];
      const body = await response.json();
      eventData = body.data?.events ?? [];
      return eventData;
    } catch {
      return [];
    }
  };

  const detailsMarkup = event => {
    const fullDescription = String(event?.description || "").trim();
    const shortDescription = String(event?.shortDescription || "").trim();
    const detailDescription = fullDescription && fullDescription !== shortDescription
      ? fullDescription
      : shortDescription;
    const location = [event?.location, event?.locationDetails].filter(Boolean).join(" · ");
    const attendance = attendanceLabel(event?.attendanceType);
    const dateTime = formatDateTime(event);
    if (!detailDescription && !location && !dateTime) return "";

    return `
      <div class="event-details-dialog__facts">
        ${dateTime ? `<div class="event-details-dialog__fact"><img src="/images/store-event.png" alt="Time" /></span><span>${escape(dateTime)}</span></div>` : ""}
        ${location ? `<div class="event-details-dialog__fact"><img src="/images/location.png" alt="Location"/><span>${escape(location)}</span></div>` : ""}
        ${attendance ? `<div class="event-details-dialog__fact"><img src="/images/icon-prepare.png" alt="Attendance"/><span>${escape(attendance)}</span></div>` : ""}
      </div>
      ${event?.offer ? `<div class="event-details-dialog__offer"><span>Special offer</span><strong>${escape(event.offer)}</strong></div>` : ""}
      ${detailDescription ? `<section class="event-details-dialog__section"><h3>About this event</h3>${paragraphMarkup(detailDescription)}</section>` : ""}
    `;
  };

  const dialog = document.createElement("dialog");
  dialog.className = "event-details-dialog";
  dialog.innerHTML = `
    <div class="event-details-dialog__panel">
      <button class="event-details-dialog__close" type="button" aria-label="Close event details">×</button>
      <p class="event-details-dialog__eyebrow">Upcoming event</p>
      <h2 class="event-details-dialog__title"></h2>
      <div class="event-details-dialog__body"></div>
      <div class="event-details-dialog__actions">
        <button class="event-details-dialog__primary" type="button"></button>
        <button class="event-details-dialog__done" type="button">Close</button>
      </div>
    </div>
  `;
  document.body.append(dialog);

  const closeButton = dialog.querySelector(".event-details-dialog__close");
  const doneButton = dialog.querySelector(".event-details-dialog__done");
  const primaryButton = dialog.querySelector(".event-details-dialog__primary");
  const title = dialog.querySelector(".event-details-dialog__title");
  const body = dialog.querySelector(".event-details-dialog__body");

  const closeDialog = () => dialog.close();
  closeButton.addEventListener("click", closeDialog);
  doneButton.addEventListener("click", closeDialog);

  primaryButton.addEventListener("click", () => {
    const action = activePrimaryAction;
    closeDialog();
    window.setTimeout(() => action?.click(), 0);
  });

  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("event-details-open");
    lastTrigger?.focus();
    lastTrigger = null;
    activePrimaryAction = null;
  });

  const openDialog = (event, trigger, primaryAction) => {
    const details = detailsMarkup(event);
    if (!details) return;
    lastTrigger = trigger;
    activePrimaryAction = primaryAction;
    title.textContent = event?.title || "Event details";
    body.innerHTML = details;
    primaryButton.textContent = primaryAction?.textContent?.trim() || event?.ctaLabel || "Learn More";
    primaryButton.hidden = !primaryAction || primaryAction.disabled;
    document.body.classList.add("event-details-open");
    dialog.showModal();
    closeButton.focus();
  };

  const enhanceCards = async () => {
    if (enhancementPending) return;
    enhancementPending = true;
    const events = await loadEventData();
    const cards = [...list.querySelectorAll(".event-card:not(.event-card--updates)")];

    cards.forEach((card, index) => {
      if (card.dataset.detailsEnhanced === "true") return;
      const content = card.querySelector(".event-card__content");
      const primaryAction = content?.querySelector(":scope > .button");
      const event = events[index];
      const details = detailsMarkup(event);
      if (!content || !primaryAction || !details) {
        card.dataset.detailsEnhanced = "true";
        return;
      }

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "event-card__details-toggle";
      toggle.setAttribute("aria-haspopup", "dialog");
      toggle.innerHTML = `<span>Event details</span><span class="event-card__details-symbol" aria-hidden="true">+</span>`;
      toggle.addEventListener("click", () => openDialog(event, toggle, primaryAction));
      content.insertBefore(toggle, primaryAction);
      card.dataset.detailsEnhanced = "true";
    });

    enhancementPending = false;
  };

  new MutationObserver(() => void enhanceCards()).observe(list, { childList: true });
  void enhanceCards();

  const rsvpDialog = document.querySelector("#rsvp-dialog");
  const rsvpForm = document.querySelector("#rsvp-form");

  list.addEventListener("click", async event => {
    const trigger = event.target.closest(".event-rsvp");
    if (!trigger || !rsvpDialog || !rsvpForm) return;

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(trigger.dataset.eventId)}`);
      if (!response.ok) return;
      const payload = await response.json();
      const item = payload.data?.event;
      if (!item) return;

      const title = rsvpForm.querySelector("#rsvp-title");
      if (title) title.textContent = `Save My Spot - ${item.title}`;

      const appointmentField = rsvpForm.querySelector("#appointment-field");
      const appointmentSelect = rsvpForm.elements.appointmentSlotId;
      const appointmentRecommended = item.attendanceType === "appointment_recommended";
      const showAppointments = Boolean(item.appointmentRequired || appointmentRecommended);
      const appointmentSlots = Array.isArray(item.appointmentSlots) ? item.appointmentSlots : [];

      if (appointmentField && appointmentSelect) {
        appointmentField.hidden = !showAppointments;
        appointmentSelect.required = Boolean(item.appointmentRequired);

        if (showAppointments) {
          appointmentSelect.innerHTML = `
            <option value="">${item.appointmentRequired ? "Choose a time" : "Choose a time (optional)"}</option>
            ${appointmentSlots.map(slot => `
              <option value="${escape(slot.id)}">
                ${escape(
                  slot.label ||
                    new Date(slot.startsAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    }),
                )}
              </option>
            `).join("")}
          `;
        }
      }
    } catch {
      // The primary RSVP script continues to handle loading and submission errors.
    }
  });
})();
