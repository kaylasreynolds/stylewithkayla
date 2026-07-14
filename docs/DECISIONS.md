# Style With Kayla — Durable Product Decisions

This log records approved product decisions that must travel with the code. The complete master plan and D1/API contract remain the detailed binding sources; this is the concise engineering ledger used during implementation and review.

## Approved baseline carried forward from the master plan and handoff

### Source and release boundaries

- The original `kaylasreynolds/stylewithkayla` `main` branch remains the public static marketing website.
- The booking and Style Profile application remains a separate private ChatGPT Sites project until an explicit integration plan preserves the marketing pages.
- Preserve the approved booking and four-section Style Profile UI. Functional milestones do not authorize a redesign.

### Booking and scheduling

- Public requests begin as `pending`; public submission never confirms an appointment.
- Routine hours are Tuesday–Saturday, 10:30 AM–1:30 PM and 2:30 PM–5:30 PM in `America/Boise`.
- Online booking requires 24 hours of notice and has a 60-day horizon.
- Service durations are 60 minutes for Event & Occasion, 90 minutes for Everyday Styling, and 180 minutes for Full Closet Refresh. There is no automatic buffer.
- Requested, proposed, and confirmed times are distinct fields. The original requested time is never overwritten.
- A pending/proposed request owns an active D1 hold until Kayla confirms, declines, releases, or replaces it. Holds do not expire automatically.
- Pending requests become administratively overdue after 24 hours.
- Every public mutation revalidates availability on the server and active holds use overlap protection.

### Services and profile routing

- Six services remain active: three women's and three men's services.
- Women's Everyday and Full Closet Refresh route by client-facing age range: `under_40`, `40_plus`, or `manual_review`.
- `manual_review` requires Kayla to select a profile type before confirmation.
- Women's Event routes to `womens_event`; Men's Event routes to `mens_event`; both general men's services route to `mens_styling`.
- Internal routing names are never shown to clients.

### Administrative approval

- Admin pages and every `/api/admin/*` endpoint require verified ChatGPT authentication and owner allowlisting.
- Kayla can confirm, decline with a reason, release a hold, or propose an available alternative time.
- Admin mutations require CSRF checks and `expectedStatus`; concurrent state changes return a conflict.
- Only confirmed bookings can receive a Style Profile.
- Booking state changes and administrative actions are append-only audit events.

### Style Profiles

- Five profile types remain: `under_40`, `over_40`, `womens_event`, `mens_styling`, and `mens_event`.
- The profile does not ask again for name, email, phone, referral source, service, or appointment time.
- The client uses a private high-entropy link without creating an account; D1 stores only its SHA-256 hash.
- Draft answers and current section are saved so the client can return later.
- Answers use stable keys/values in flexible JSON. Selection limits and submission requirements are server-enforced.
- Submission creates an immutable revision snapshot and locks client editing.
- Kayla may deliberately correct or reopen a profile; each action creates history and reopening rotates the private link.
- Visual choice cards and accessible labels remain part of the approved experience.

### Privacy, retention, and communications

- Public references are display identifiers and never authorize private access.
- Private/admin responses use `Cache-Control: no-store`; private links use `Referrer-Policy: no-referrer`.
- Client strings are length-limited and never rendered as raw HTML. Sensitive payloads reject unexpected keys.
- Written booking/profile history is retained for two years after the most recent completed appointment.
- Retention cleanup revokes expired private links and deletes due written data only when there is no active appointment or unresolved access/correction request. Deletion anonymizes a minimal client/audit row rather than retaining booking or Profile content.
- Client access, correction, and deletion requests are recorded and resolved in the protected admin area. Active appointments block deletion until they are cancelled or declined.
- Inspiration-image uploads through private R2 are explicitly deferred for the first release. Clients use the optional inspiration-link field instead.
- If R2 uploads are approved later, they remain limited to one private image with deletion 30 days after completion or cancellation; size and MIME policy must be approved before implementation.
- Until a delivery provider is approved, communications are recorded as deferred; the system must not claim an email or SMS was sent.

### Integration boundaries

- D1 is the authority for booking state, holds, client details, profiles, and communication history.
- Outlook will eventually be the authority for busy/free and linked confirmed calendar events, but Microsoft Graph begins only after manual approval works end to end.
- Macy's calendar access remains disabled unless Macy's IT grants permission. No tenant-policy workaround is permitted.
- R2 uploads, notifications, and Microsoft Graph are separate later milestones and are not implied by core booking/profile work.

## 2026-07-14 — Private Style Profile link lifetime

- Status: approved by Kayla Reynolds
- A Style Profile access link expires 30 days after it is issued.
- Only a SHA-256 hash of the high-entropy token is stored in D1.
- Confirming a booking issues the first link. Reopening or reissuing a profile revokes prior links and creates a new 30-day link.
- Expired and revoked links cannot read or modify profile data.
- The lifetime is enforced centrally by `STYLE_PROFILE_TOKEN_TTL_MS`; changing it requires a new decision-log entry and tests.

## 2026-07-14 — Alternate-time response links

- Alternate-time links use the same private-token security baseline as Style Profile links.
- They expire at the earlier of 30 days after issuance or the proposed appointment start.
- Accepting or replacing the proposed time revokes the action link immediately.
- Accepting creates the confirmed appointment and a separate 30-day Style Profile link.

## Deferred decisions

- Email/SMS delivery provider and sender identity
- Whether to enable R2 uploads after the first release, plus image size and formats
- Microsoft account/calendar connection (Graph phase)
- External scheduler for the protected retention-maintenance endpoint
