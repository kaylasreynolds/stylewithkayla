"use client";

import { useEffect } from "react";

type ApiErrorPayload = {
  error?: {
    message?: string;
    fieldErrors?: Record<string, string>;
  };
};

const fieldAliases: Record<string, string> = {
  "client.fullName": "name",
  "client.email": "email",
  "client.phone": "phone",
  returningClient: "returning",
  howHeard: "heard",
  eventType: "eventType",
  eventDate: "eventDate",
  bookingNotes: "notes",
  "privacy.acknowledged": "privacy",
  requestedStartAt: "requestedStartAt",
};

function alertMessage(message: string) {
  if (/^Enter\s/i.test(message)) return message.replace(/^Enter\s/i, "Please enter ");
  if (/^Choose\s/i.test(message)) return message.replace(/^Choose\s/i, "Please choose ");
  if (/^Use\s/i.test(message)) return message.replace(/^Use\s/i, "Please use ");
  if (message === "This field is required.") return "Please complete the required field.";
  return message;
}

function labelControl(text: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(".details-form label"))
    .find((label) => label.textContent?.includes(text))
    ?.querySelector<HTMLElement>("input, select, textarea") ?? null;
}

function controlForField(field: string): HTMLElement | null {
  switch (fieldAliases[field] ?? field) {
    case "name":
      return document.querySelector('.details-form input[placeholder="First and last name"]');
    case "email":
      return document.querySelector('.details-form input[type="email"]');
    case "phone":
      return document.querySelector('.details-form input[type="tel"]');
    case "returning":
      return document.querySelector(".details-form .choice-field");
    case "heard":
      return labelControl("How did you hear about me?");
    case "eventType":
      return labelControl("What type of event?");
    case "eventDate":
      return document.querySelector('.details-form input[type="date"]');
    case "notes":
      return document.querySelector(".details-form textarea");
    case "privacy":
      return document.querySelector('.details-form .privacy-check input[type="checkbox"]');
    case "requestedStartAt":
      return document.querySelector(".time-list button.selected, .time-list button");
    default:
      return null;
  }
}

function clearFieldErrors() {
  document.querySelectorAll(".api-field-error").forEach((node) => node.remove());
  document.querySelectorAll<HTMLElement>(".api-field-invalid").forEach((node) => {
    node.classList.remove("api-field-invalid");
    node.removeAttribute("aria-invalid");
    const describedBy = node.getAttribute("aria-describedby");
    if (describedBy?.startsWith("api-field-error-")) node.removeAttribute("aria-describedby");
  });
}

function openCorrectStep(fields: string[]) {
  const needsTime = fields.some((field) => (fieldAliases[field] ?? field) === "requestedStartAt");
  const editLabel = needsTime ? "Date & time" : "Contact";
  const row = Array.from(document.querySelectorAll<HTMLElement>(".review-list > div"))
    .find((item) => item.querySelector("span")?.textContent?.trim() === editLabel);
  row?.querySelector<HTMLButtonElement>("button")?.click();
}

function renderFieldErrors(fieldErrors: Record<string, string>) {
  clearFieldErrors();
  const entries = Object.entries(fieldErrors);
  if (!entries.length) return;

  openCorrectStep(entries.map(([field]) => field));

  window.setTimeout(() => {
    let firstControl: HTMLElement | null = null;

    entries.forEach(([field, rawMessage], index) => {
      const control = controlForField(field);
      if (!control) return;

      const focusTarget = control.matches("fieldset")
        ? control.querySelector<HTMLElement>("button, input, select, textarea") ?? control
        : control;
      firstControl ??= focusTarget;

      const highlightTarget = control.matches('input[type="checkbox"]')
        ? control.closest<HTMLElement>("label") ?? control
        : control;
      highlightTarget.classList.add("api-field-invalid");
      control.setAttribute("aria-invalid", "true");

      const errorId = `api-field-error-${index}`;
      control.setAttribute("aria-describedby", errorId);
      const message = document.createElement("p");
      message.id = errorId;
      message.className = "api-field-error";
      message.setAttribute("role", "alert");
      message.textContent = alertMessage(rawMessage);

      const container = control.matches("fieldset")
        ? control
        : control.closest("label") ?? control.parentElement;
      container?.append(message);
    });

    firstControl?.focus({ preventScroll: true });
    firstControl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

export default function BookingValidationErrors() {
  useEffect(() => {
    if (window.location.pathname !== "/book") return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const requestUrl = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].toString() : args[0].url;

      if (!requestUrl.includes("/api/bookings") || response.ok) return response;

      try {
        const payload = await response.clone().json() as ApiErrorPayload;
        const fieldErrors = payload.error?.fieldErrors;
        if (!fieldErrors || !Object.keys(fieldErrors).length) return response;

        renderFieldErrors(fieldErrors);
        const firstMessage = Object.values(fieldErrors)[0];
        const revisedPayload: ApiErrorPayload = {
          ...payload,
          error: {
            ...payload.error,
            message: alertMessage(firstMessage),
            fieldErrors,
          },
        };
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.set("content-type", "application/json");
        return new Response(JSON.stringify(revisedPayload), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch {
        return response;
      }
    };

    const clearChangedField = (event: Event) => {
      const target = event.target as HTMLElement;
      const invalid = target.closest<HTMLElement>(".api-field-invalid") ?? (target.classList.contains("api-field-invalid") ? target : null);
      if (!invalid) return;
      invalid.classList.remove("api-field-invalid");
      target.removeAttribute("aria-invalid");
      const describedBy = target.getAttribute("aria-describedby");
      if (describedBy) document.getElementById(describedBy)?.remove();
      target.removeAttribute("aria-describedby");
    };

    document.addEventListener("input", clearChangedField);
    document.addEventListener("change", clearChangedField);
    document.addEventListener("click", clearChangedField);

    return () => {
      window.fetch = originalFetch;
      document.removeEventListener("input", clearChangedField);
      document.removeEventListener("change", clearChangedField);
      document.removeEventListener("click", clearChangedField);
    };
  }, []);

  return (
    <style>{`
      .api-field-invalid {
        border-color: #a63f3f !important;
        box-shadow: 0 0 0 2px rgba(166, 63, 63, 0.14) !important;
      }
      fieldset.api-field-invalid,
      label.api-field-invalid {
        border: 1px solid #a63f3f !important;
        border-radius: 5px;
        padding: 10px;
      }
      .api-field-error {
        margin: 6px 0 0;
        color: #852f2f;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.4;
      }
    `}</style>
  );
}
