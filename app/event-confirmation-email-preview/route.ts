import { buildEventConfirmationEmailHtml } from "@/lib/server/event-confirmation-template";

export async function GET() {
  const html = buildEventConfirmationEmailHtml({
    to: "preview@example.com",
    guestName: "Kayla",
    eventTitle: "Iberjoya Trunk Show",
    eventStartsAt: Date.parse("2026-09-17T16:00:00Z"),
    eventEndsAt: Date.parse("2026-09-18T00:00:00Z"),
    timezone: "America/Boise",
    location: "Macy’s Boise Towne Square, 370 N. Milwaukee St., Boise, ID 83704, Fine Jewelry · 1st Floor",
    eventOffer: "Receive 10% off during the event with your appointment. Walk-ins are welcome too.",
    appointmentStartsAt: Date.parse("2026-09-17T19:00:00Z"),
    appointmentEndsAt: Date.parse("2026-09-17T19:30:00Z"),
    appointmentLabel: "1:00 PM–1:30 PM",
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
