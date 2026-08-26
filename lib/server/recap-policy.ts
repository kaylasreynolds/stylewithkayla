export const RECAP_SUMMARY_TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export type RecapSummaryContent = {
  client: { firstName: string; appointmentDate: string | null; serviceName: string };
  whatWeSolved: string | null;
  insights: Array<{ polarity: "worked" | "didnt_work"; category: string; insightText: string }>;
  formulas: Array<{ formulaText: string; explanation: string | null }>;
  items: Array<{ itemName: string; brand: string | null; size: string | null; color: string | null; note: string | null }>;
  priorities: Array<{ priorityText: string; category: string | null }>;
  kaylaNote: string | null;
  nextStylingMoment: { serviceType: string | null; timing: string | null; reason: string | null; bookingCtaEnabled: boolean } | null;
};

type Row = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;

/** The sole projection from private, live recap records to client-facing summary content. */
export function buildRecapSummaryContent(
  recap: Row,
  insights: Row[],
  items: Row[],
  formulas: Row[],
  priorities: Row[],
  client: Row,
  booking: Row,
  service: Row,
): RecapSummaryContent {
  const next = {
    serviceType: text(recap.nextMomentServiceType),
    timing: text(recap.nextMomentTiming),
    reason: text(recap.nextMomentReason),
    bookingCtaEnabled: Boolean(recap.nextMomentBookingCtaEnabled),
  };
  return {
    client: {
      firstName: (text(client.fullName)?.split(/\s+/)[0]) || "there",
      appointmentDate: text(booking.confirmedStartAt),
      serviceName: text(service.name) || "Personal Styling",
    },
    whatWeSolved: text(recap.whatWeSolved),
    insights: insights.filter(row => Boolean(row.clientFacing) && text(row.insightText)).map(row => ({ polarity: row.polarity === "didnt_work" ? "didnt_work" : "worked", category: text(row.category) || "other", insightText: text(row.insightText)! })),
    formulas: formulas.filter(row => text(row.formulaText)).slice(0, 4).map(row => ({ formulaText: text(row.formulaText)!, explanation: text(row.explanation) })),
    items: items.filter(row => Boolean(row.clientFacing) && text(row.itemName)).map(row => ({ itemName: text(row.itemName)!, brand: text(row.brand), size: text(row.size), color: text(row.color), note: text(row.note) })),
    priorities: [...priorities].filter(row => Boolean(row.clientFacing) && text(row.priorityText)).sort((a, b) => Number(a.rank ?? 0) - Number(b.rank ?? 0)).map(row => ({ priorityText: text(row.priorityText)!, category: text(row.category) })),
    kaylaNote: text(recap.kaylaNote),
    nextStylingMoment: next.serviceType || next.timing || next.reason ? next : null,
  };
}
