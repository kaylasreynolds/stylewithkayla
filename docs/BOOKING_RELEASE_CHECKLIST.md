# Booking Release Manual QA Checklist

Use this checklist for manual acceptance testing before releasing booking and Style Profile changes. This is not an automated test plan; complete each item by walking through the product as a client or admin and recording the observed result, tester, date, environment, and any follow-up ticket.

## Test session details

- Environment:
- Build/commit:
- Tester:
- Date:
- Browser/device:
- Test client account/email:
- Test admin account/email:
- Notes:

## General release readiness

- [ ] Confirm the test environment is running the intended release candidate.
- [ ] Confirm test email/SMS delivery providers or capture tools are available for client/admin notifications, or confirm the UI uses no-provider fallback copy instead of claiming delivery.
- [ ] Confirm test payment, calendar, and external-service integrations are in sandbox mode, if applicable.
- [ ] Confirm test data can be safely created, updated, exported, cancelled, declined, completed, and deleted.
- [ ] Confirm no real client personal data is used during testing.

## Public booking submission

- [ ] Open the public booking entry point as a signed-out visitor.
- [ ] Confirm the page clearly explains the booking flow and required information.
- [ ] Submit a valid booking request with client contact details, requested service, requested date/time, and any required notes.
- [ ] Confirm required-field validation is shown for missing or malformed inputs.
- [ ] Confirm the client sees a success or next-steps message after submission, such as “Kayla will follow up with confirmation details,” when no delivery provider is active.
- [ ] Confirm the booking request appears in the admin queue with the submitted details intact.
- [ ] Confirm expected client and admin notifications are sent/captured only when providers are active; otherwise confirm communication is recorded for follow-up without claiming email or SMS delivery.

## Age-based profile routing

- [ ] Submit or update a profile using an adult client age/date of birth.
- [ ] Confirm the adult profile path, copy, consent language, and required fields are shown.
- [ ] Submit or update a profile using a minor client age/date of birth.
- [ ] Confirm the minor/guardian path, copy, consent language, and required fields are shown.
- [ ] Confirm edge cases around the age threshold route to the correct profile experience.
- [ ] Confirm admin views clearly show the client age category or review context needed to act appropriately.

## Manual-review routing

- [ ] Submit a booking/profile scenario that should be automatically eligible for standard admin review.
- [ ] Confirm it appears in the expected standard queue or status.
- [ ] Submit a booking/profile scenario that should require manual review.
- [ ] Confirm it appears in the manual-review queue or status with a clear reason.
- [ ] Confirm the client-facing messaging does not promise confirmation before admin review is complete.
- [ ] Confirm admin can resolve, confirm, decline, or request follow-up from the manual-review state.

## Event booking routing

- [ ] Start a booking request for an event styling service.
- [ ] Confirm event-specific fields appear, such as event date, location, dress code, timeline, or inspiration links when applicable.
- [ ] Submit a valid event booking request.
- [ ] Confirm the request is routed to the event booking queue/status rather than the standard appointment path.
- [ ] Confirm event details are visible to admin without data loss or formatting issues.
- [ ] Confirm client/admin notifications identify the request as event-related.

## Active hold creation

- [ ] Submit a booking request for an available appointment time.
- [ ] Confirm an active hold is created for the requested time while the request is pending.
- [ ] Confirm the held time is not offered as freely available to another client during the hold window.
- [ ] Confirm the hold displays accurate expiration, owner, service, and request details to admin.
- [ ] Confirm the hold is released when the request is declined, cancelled, expired, or moved to an alternate time.
- [ ] Confirm the hold becomes a confirmed appointment when admin confirms the booking.

## Admin confirmation

- [ ] Open a pending booking request as admin.
- [ ] Confirm the submitted request details, profile context, hold status, and client contact details are visible.
- [ ] Confirm the request using the admin action.
- [ ] Confirm the booking status changes to confirmed.
- [ ] Confirm any active hold is converted into the confirmed appointment/reservation.
- [ ] Confirm the client receives clear confirmation details when a provider is active; otherwise confirm the admin-facing copy says “Communication recorded for follow-up” and gives Kayla manual follow-up guidance.
- [ ] Confirm the admin view shows an audit trail or status history for the confirmation.

## Admin alternate-time proposal

- [ ] Open a pending booking request as admin.
- [ ] Propose an alternate appointment date/time.
- [ ] Confirm the alternate time is validated for availability and business rules.
- [ ] Confirm the request status changes to pending client acceptance or equivalent.
- [ ] Confirm the original requested hold is released or clearly superseded according to product rules.
- [ ] Confirm the proposed alternate time is held, reserved, or otherwise protected according to product rules.
- [ ] Confirm the client receives a message with the proposed alternate time and clear accept/decline instructions when a provider is active; otherwise confirm the app records the communication for follow-up without claiming delivery.

## Client alternate-time acceptance

- [ ] Open the alternate-time proposal as the client from the notification or client-facing request page.
- [ ] Confirm the proposed date/time and service details are displayed clearly before acceptance.
- [ ] Accept the alternate time.
- [ ] Confirm the request status changes to confirmed or the intended accepted state.
- [ ] Confirm the accepted alternate time becomes the active appointment/reservation.
- [ ] Confirm the client receives confirmation when a provider is active; otherwise confirm the page says Kayla will follow up with confirmation details and the admin view updates without requiring a page refresh, or updates correctly after refresh.
- [ ] Confirm expired, cancelled, or already-handled alternate proposals cannot be accepted.

## Private Style Profile link access

- [ ] Generate or locate a private Style Profile link for a client.
- [ ] Open the link while signed out.
- [ ] Confirm the link grants access only to the intended profile experience and does not expose unrelated admin/client data.
- [ ] Open the link after signing in as another client, if applicable.
- [ ] Confirm cross-account access is blocked or limited according to product rules.
- [ ] Confirm expired or revoked private links no longer provide access.
- [ ] Confirm the page copy makes privacy expectations clear without exposing sensitive tokens or internal IDs, and admin copy says “Copy this private link into the client message” when no provider sends it automatically.

## Draft save and final submission

- [ ] Start a Style Profile and enter partial information.
- [ ] Save as draft or leave and return using the supported draft flow.
- [ ] Confirm draft data persists accurately, including multiline text, selections, and inspiration links.
- [ ] Confirm incomplete drafts are clearly marked as drafts in client/admin views.
- [ ] Complete all required profile fields and submit the final profile.
- [ ] Confirm final submission locks client editing when that is the intended product behavior.
- [ ] Confirm submitted data appears accurately in admin review.
- [ ] Confirm client and admin notifications or status changes occur as expected.

## Admin profile review

- [ ] Open a submitted Style Profile as admin.
- [ ] Confirm all client answers, routing context, timestamps, and related booking information are visible.
- [ ] Confirm admin can mark the profile reviewed, needs follow-up, or equivalent supported states.
- [ ] Confirm admin-only notes or review decisions are not visible to the client unless intentionally shared.
- [ ] Confirm profile review status is reflected in the relevant booking/profile queues.
- [ ] Confirm profile history or retention indicators match the approved product policy.

## Cancellation, decline, completion

- [ ] Cancel a pending request as the client, if supported.
- [ ] Confirm status, notifications, and active hold release are correct.
- [ ] Decline a pending request as admin.
- [ ] Confirm status, notifications, and active hold release are correct.
- [ ] Cancel a confirmed appointment through the supported admin/client path.
- [ ] Confirm calendar/reservation state, notifications, and admin status are correct.
- [ ] Mark a confirmed appointment as completed.
- [ ] Confirm the completed state is reflected in admin history and is no longer treated as pending/upcoming.
- [ ] Confirm cancelled, declined, and completed records remain available or are hidden according to product rules.

## Privacy export, correction, and deletion paths

- [ ] Request a privacy export for a test client profile.
- [ ] Confirm exported data includes expected booking/profile fields and excludes unrelated clients or internal-only secrets.
- [ ] Request a correction to client booking/profile data through the supported path.
- [ ] Confirm the correction is captured, reviewed, and applied or rejected with appropriate status/notes.
- [ ] Request deletion for a test client profile.
- [ ] Confirm deletion removes or anonymizes personal data according to product policy while preserving required operational/audit records.
- [ ] Confirm deleted data is no longer accessible through public, client, private-link, or admin paths except where retention rules intentionally preserve it.
- [ ] Confirm privacy actions are logged for admin follow-up.

## No-store and private-link cache behavior

- [ ] Open public booking pages and confirm normal navigation does not reveal private client data through browser back/forward behavior.
- [ ] Open a private Style Profile link and inspect response headers or browser behavior for no-store/private caching expectations.
- [ ] Confirm private-link pages do not remain accessible from browser cache after sign-out, link revocation, expiration, or session change.
- [ ] Confirm sensitive profile data is not stored in share previews, page metadata, logs visible to clients, or browser autofill beyond intentional form behavior.
- [ ] Confirm copying or sharing a private link follows the approved expiration and revocation rules.
- [ ] Confirm the private-link token is not exposed in unnecessary redirects, analytics events, or client-visible error messages.

## Release sign-off

- [ ] All required checklist items have passed or have documented, approved exceptions.
- [ ] High-priority defects have owners and release decisions.
- [ ] Test data cleanup is complete or intentionally retained for audit/debugging.
- [ ] Product/admin stakeholders have reviewed manual QA results.
- [ ] Release owner approves proceeding.
