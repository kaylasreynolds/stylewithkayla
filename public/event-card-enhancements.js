(() => {
  const list = document.querySelector("#events-list");

  if (!list) return;

  const escape = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      character =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );

  let eventData = null;
  let enhancementPending = false;

  const loadEventData = async () => {
    if (eventData) return eventData;

    try {
      const response = await fetch("/api/events", {
        headers: { Accept: "application/json" },
      });

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
    const locationDetails = String(event?.locationDetails || "").trim();
    const detailDescription =
      fullDescription && fullDescription !== shortDescription
        ? fullDescription
        : "";

    if (!detailDescription && !locationDetails) return "";

    return `
      ${detailDescription ? `<p>${escape(detailDescription)}</p>` : ""}
      ${
        locationDetails
          ? `<div class="event-details-dialog__section"><span class="event-details-dialog__label">Location details</span><p>${escape(locationDetails)}</p></div>`
          : ""
      }
    `;
  };

  const dialog = document.createElement("dialog");
  dialog.className = "event-details-dialog";
  dialog.innerHTML = `
    <div class="event-details-dialog__panel">
      <button class="event-details-dialog__close" type="button" aria-label="Close event details">×</button>
      <p class="event-details-dialog__eyebrow">Event details</p>
      <h2 class="event-details-dialog__title"></h2>
      <div class="event-details-dialog__body"></div>
    </div>
  `;
  document.body.append(dialog);

  const closeButton = dialog.querySelector(".event-details-dialog__close");
  const title = dialog.querySelector(".event-details-dialog__title");
  const body = dialog.querySelector(".event-details-dialog__body");
  let lastTrigger = null;

  const closeDialog = () => {
    dialog.close();
  };

  closeButton.addEventListener("click", closeDialog);

  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("event-details-open");
    lastTrigger?.focus();
    lastTrigger = null;
  });

  const openDialog = (event, trigger) => {
    const details = detailsMarkup(event);
    if (!details) return;

    lastTrigger = trigger;
    title.textContent = event?.title || "Event details";
    body.innerHTML = details;
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
      toggle.innerHTML = `
        <span>Event details</span>
        <span class="event-card__details-symbol" aria-hidden="true">+</span>
      `;

      toggle.addEventListener("click", () => openDialog(event, toggle));

      content.insertBefore(toggle, primaryAction);
      card.dataset.detailsEnhanced = "true";
    });

    enhancementPending = false;
  };

  const observer = new MutationObserver(() => {
    void enhanceCards();
  });

  observer.observe(list, { childList: true });
  void enhanceCards();
})();
