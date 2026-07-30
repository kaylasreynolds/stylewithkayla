import { formatEventSchedule } from "./event-date-time";

export const CURRENT_EVENT_LABELS = ["Open House", "Workshop", "Community Event", "Presell", "Special Event", "Custom"] as const;
export const CURRENT_ATTENDANCE_OPTIONS = [
  ["open_attendance", "Open Attendance"],
  ["appointment_required", "Appointment Required"],
  ["appointment_recommended", "Appointment Recommended"],
  ["general_rsvp", "RSVP Required"],
  ["information_only", "Information Only"],
] as const;

export type PublicEventPresentation = Record<string, unknown>;

export function eventLabelText(event: PublicEventPresentation) {
  return String(event.eventLabel === "Custom" ? event.customLabel || "Custom label" : event.eventLabel || "Event label");
}

export function attendanceText(value: unknown) {
  return CURRENT_ATTENDANCE_OPTIONS.find(([key]) => key === value)?.[1] ?? (value ? "Unsupported attendance type" : "Not selected");
}

export function publicEventView(event: PublicEventPresentation) {
  const costType = String(event.costType ?? "");
  const defaultCosts: Record<string, string> = { complimentary: "Complimentary", purchase_required: "Purchase required", free_with_rsvp: "Free with RSVP" };
  const ctaAction = String(event.ctaAction ?? "");
  return {
    schedule: formatEventSchedule(event),
    label: eventLabelText(event),
    attendance: attendanceText(event.attendanceType),
    cost: costType === "not_applicable" ? "" : String(event.costLabel || defaultCosts[costType] || "Not set"),
    offer: String(event.offer || event.offerDetails || event.offerTerms || ""),
    ctaVisible: Boolean(ctaAction && ctaAction !== "none"),
    ctaLabel: String(event.ctaLabel || "Learn More"),
  };
}
