import { ApiError } from "./http";

type Row = Record<string, unknown>;

export async function loadRecapSummarySource(db: D1Database, bookingId: string) {
  const base = await db.prepare(`SELECT r.id AS recapId,r.status,r.what_we_solved AS whatWeSolved,r.kayla_note AS kaylaNote,r.next_moment_service_type AS nextMomentServiceType,r.next_moment_timing AS nextMomentTiming,r.next_moment_reason AS nextMomentReason,r.next_moment_booking_cta_enabled AS nextMomentBookingCtaEnabled,c.full_name AS fullName,c.email,b.confirmed_start_at AS confirmedStartAt,s.name AS serviceName FROM appointment_recaps r JOIN bookings b ON b.id=r.booking_id JOIN clients c ON c.id=r.client_id JOIN services s ON s.id=b.service_id WHERE r.booking_id=?`).bind(bookingId).first<Row>();
  if (!base) throw new ApiError(404, "RECAP_NOT_FOUND", "This booking does not have an appointment recap yet.");
  const [insights, items, formulas, priorities] = await Promise.all([
    db.prepare(`SELECT polarity,category,insight_text AS insightText,client_facing AS clientFacing FROM recap_insights WHERE recap_id=? ORDER BY sort_order`).bind(base.recapId).all<Row>(),
    db.prepare(`SELECT item_name AS itemName,brand,size,color,note,client_facing AS clientFacing FROM recap_items WHERE recap_id=? ORDER BY sort_order`).bind(base.recapId).all<Row>(),
    db.prepare(`SELECT formula_text AS formulaText,explanation FROM recap_formulas WHERE recap_id=? ORDER BY sort_order`).bind(base.recapId).all<Row>(),
    db.prepare(`SELECT category,priority_text AS priorityText,rank,client_facing AS clientFacing FROM recap_priorities WHERE recap_id=? ORDER BY rank`).bind(base.recapId).all<Row>(),
  ]);
  const recap: Row = { ...base, nextMomentBookingCtaEnabled: Boolean(base.nextMomentBookingCtaEnabled) };
  return { recap, insights: insights.results, items: items.results, formulas: formulas.results, priorities: priorities.results, client: { fullName: base.fullName, email: base.email }, booking: { confirmedStartAt: base.confirmedStartAt ? new Date(base.confirmedStartAt as number).toISOString() : null }, service: { name: base.serviceName } };
}
