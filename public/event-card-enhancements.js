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
      ${
        detailDescription
          ? `<p>${escape(detailDescription)}</p>`
          : ""
      }
      ${
        locationDetails
          ? `<p><span class="event-card__details-label">Location details</span>${escape(locationDetails)}</p>`
          : ""
      }
    `;
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

      const detailsId = `event-details-${escape(event?.id || index)}`;
      const panel = document.createElement("div");
      panel.className = "event-card__details";
      panel.id = detailsId;
      panel.hidden = true;
      panel.innerHTML = details;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "event-card__details-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", detailsId);
      toggle.innerHTML = `
        <span class="event-card__details-text">Event details</span>
        <span class="event-card__details-symbol" aria-hidden="true">+</span>
      `;

      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        panel.hidden = expanded;
        toggle.querySelector(".event-card__details-text").textContent =
          expanded ? "Event details" : "Less details";
        toggle.querySelector(".event-card__details-symbol").textContent =
          expanded ? "+" : "−";
      });

      content.insertBefore(panel, primaryAction);
      content.insertBefore(toggle, panel);
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
