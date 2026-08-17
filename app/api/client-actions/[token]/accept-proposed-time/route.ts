import { manageAppointmentUrl as buildManageAppointmentUrl } from "@/lib/appointment/manage-path";
import { deliverAppointmentEmails } from "@/lib/server/appointment-email-delivery";
import { hashPrivateToken, randomPrivateToken } from "@/lib/server/crypto";
import { ApiError, dataResponse, withApi } from "@/lib/server/http";
import { requireClientActionAccess } from "@/lib/server/profile-access";
import { STYLE_PROFILE_TOKEN_TTL_MS } from "@/lib/server/profile-policy";
import { getD1 } from "@/lib/server/runtime";

type Params = { params: Promise<{ token: string }> };
type Booking = {
  status: string;
  publicReference: string;
  profileType: string | null;
  startsAt: number | null;
  endsAt: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  audience: "women" | "men";
  notes: string | null;
  holdId: string | null;
};

export async function POST(request: Request, ctx: Params) {
  return withApi(async id => {
    const { token } = await ctx.params;
    const access = await requireClientActionAccess(token);
    const db = getD1();
    const booking = await db.prepare(`SELECT b.status,b.public_reference AS publicReference,b.profile_type AS profileType,b.proposed_start_at AS startsAt,b.proposed_end_at AS endsAt,b.booking_notes AS notes,c.full_name AS clientName,c.email AS clientEmail,c.phone AS clientPhone,s.name AS serviceName,s.audience,h.id AS holdId FROM bookings b JOIN clients c ON c.id=b.client_id JOIN services s ON s.id=b.service_id LEFT JOIN booking_holds h ON h.booking_id=b.id AND h.active=1 AND h.kind='proposed' WHERE b.id=?`).bind(access.bookingId).first<Booking>();
    if (!booking || booking.status !== "change_proposed" || !booking.holdId || booking.startsAt === null || booking.endsAt === null) throw new ApiError(409, "ACTION_NO_LONGER_AVAILABLE", "This alternate-time request is no longer active.");
    if (!booking.profileType) throw new ApiError(409, "PROFILE_TYPE_REQUIRED", "Please contact Kayla to finish confirming this appointment.");

    const rawProfileToken = randomPrivateToken();
    const rawManageToken = randomPrivateToken();
    const profileHash = await hashPrivateToken(rawProfileToken);
    const manageHash = await hashPrivateToken(rawManageToken);
    const now = Date.now();
    const profileExpires = now + STYLE_PROFILE_TOKEN_TTL_MS;
    const manageExpires = now + 365 * 86_400_000;
    const origin = new URL(request.url).origin;
    const profileAccessUrl = `${origin}/style-profile/${rawProfileToken}`;
    const manageAppointmentUrl = buildManageAppointmentUrl(request.url, rawManageToken);
    const calendarUrl = `${origin}/api/manage/${encodeURIComponent(rawManageToken)}/calendar`;

    await db.batch([
      db.prepare(`UPDATE bookings SET status='confirmed',confirmed_start_at=?,confirmed_end_at=?,confirmed_at=?,updated_at=? WHERE id=? AND status='change_proposed' AND EXISTS(SELECT 1 FROM booking_holds WHERE id=? AND active=1)`).bind(booking.startsAt, booking.endsAt, now, now, access.bookingId, booking.holdId),
      db.prepare(`UPDATE booking_holds SET kind='confirmed' WHERE id=? AND active=1`).bind(booking.holdId),
      db.prepare(`INSERT INTO style_profiles(id,booking_id,client_id,profile_type,status,schema_version,answers,current_section,created_at,updated_at) SELECT ?,id,client_id,profile_type,'draft',1,'{}',1,?,? FROM bookings WHERE id=? AND status='confirmed' ON CONFLICT(booking_id) DO NOTHING`).bind(crypto.randomUUID(), now, now, access.bookingId),
      db.prepare(`UPDATE private_access_tokens SET revoked_at=? WHERE booking_id=? AND purpose IN ('alternate_time','style_profile','manage_appointment') AND revoked_at IS NULL`).bind(now, access.bookingId),
      db.prepare(`INSERT INTO private_access_tokens(id,booking_id,profile_id,purpose,token_hash,expires_at,created_at) SELECT ?,p.booking_id,p.id,'style_profile',?,?,? FROM style_profiles p WHERE p.booking_id=?`).bind(crypto.randomUUID(), profileHash, profileExpires, now, access.bookingId),
      db.prepare(`INSERT INTO private_access_tokens(id,booking_id,purpose,token_hash,expires_at,created_at) SELECT ?,id,'manage_appointment',?,?,? FROM bookings WHERE id=? AND status='confirmed'`).bind(crypto.randomUUID(), manageHash, manageExpires, now, access.bookingId),
      db.prepare(`INSERT INTO booking_status_history(id,booking_id,from_status,to_status,actor_type,metadata,created_at) SELECT ?,id,'change_proposed','confirmed','client',?,? FROM bookings WHERE id=? AND status='confirmed'`).bind(crypto.randomUUID(), JSON.stringify({ action: "accept_proposed_time", tokenId: access.tokenId, profileLinkExpiresAt: new Date(profileExpires).toISOString() }), now, access.bookingId),
    ]);
    const updated = await db.prepare(`SELECT status FROM bookings WHERE id=?`).bind(access.bookingId).first<{ status: string }>();
    if (updated?.status !== "confirmed") throw new ApiError(409, "ACTION_NO_LONGER_AVAILABLE", "This alternate-time request changed. Please contact Kayla.");

    const emailDelivery = await deliverAppointmentEmails(db, "proposal_accepted", {
      bookingId: access.bookingId, publicReference: booking.publicReference, clientName: booking.clientName, clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone, serviceName: booking.serviceName, audience: booking.audience, startsAt: booking.startsAt, endsAt: booking.endsAt,
      notes: booking.notes, profileUrl: profileAccessUrl, manageUrl: manageAppointmentUrl, calendarUrl,
    });
    return dataResponse({ status: "confirmed", profileAccessUrl, profileAccessExpiresAt: new Date(profileExpires).toISOString(), manageAppointmentUrl, emailDelivery }, 200, id);
  });
}
