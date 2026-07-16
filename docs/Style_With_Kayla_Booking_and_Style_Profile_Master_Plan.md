# Style With Kayla — Booking & Style Profile Master Plan

**Status:** Proposed planning baseline for review before UX, database, and endpoint design  
**Prepared:** July 13, 2026  
**Source material:** Five current Microsoft Forms plus the established service structure for Women's Styling and Men's Styling

## 1. Purpose

This document translates the existing Microsoft Forms into a cleaner website flow. It preserves the useful detail Kayla relies on when pre-pulling merchandise while removing repeated contact fields, duplicate questions, unnecessary required answers, and visible client categorization.

This is a content and behavior plan. It should be approved before database migrations, API endpoints, or final form UI are built.

## 2. Confirmed decisions

- Clients submit a booking request before completing a Style Profile.
- New requests begin as `pending` and are confirmed or declined by Kayla.
- A requested appointment time and a confirmed appointment time must be stored separately because Kayla may approve the request at a different time.
- Name, email, and phone are collected during booking and are not repeated in the Style Profile.
- “How did you hear about me?” is collected once during booking.
- Women's Everyday Styling and Women's Full Closet Refresh use an age-based routing question.
- The client sees a normal age-range question, not an internal label such as “Misses” or “Over 40 Profile.”
- Women's Event & Occasion Styling does not use the age split.
- Men's Everyday Styling and Men's Full Closet Refresh share one general men's profile.
- Men's Event & Occasion Styling uses its own event profile.
- The rare mid-20s plus-size form is not a permanent automatic route yet. Unusual needs can be recorded in booking notes and handled with a future override.
- Visual references should remain part of the website profiles, with accessible text labels and alt text.

## 3. Client journey

1. Client chooses a service from the Women's or Men's Styling page.
2. The booking request opens with that service preselected.
3. Client provides contact information, requested appointment timing, and a few routing details.
4. The request is saved as `pending`.
5. Kayla approves, declines, or proposes a different time.
6. When confirmed, the client receives the confirmed details, calendar options, and a private Style Profile link.
7. The link silently loads the correct profile.
8. The client completes the profile before the appointment.
9. Kayla sees the booking and Style Profile together in the admin view.

## 4. Service-to-profile routing

| Public service | Additional booking question | Internal profile type |
|---|---|---|
| Women's Everyday Styling | Age range | `under_40` or `over_40` |
| Women's Full Closet Refresh | Age range | `under_40` or `over_40` |
| Women's Event & Occasion Styling | Event type and event date | `womens_event` |
| Men's Everyday Styling | None | `mens_styling` |
| Men's Full Closet Refresh | None | `mens_styling` |
| Men's Event & Occasion Styling | Event type and event date | `mens_event` |

Suggested age-range answer labels:

- Under 40
- 40 or older
- Prefer not to answer — sends the request to Kayla for manual profile selection

The internal values can remain `under_40`, `40_plus`, and `manual_review`; the client should never see database terminology.

## 5. Booking request

### Questions shown to every client

| Field key | Client-facing question | Input | Requirement / behavior |
|---|---|---|---|
| `client_name` | Full name | Text | Required |
| `email` | Email address | Email | Required; used for confirmation and private link |
| `phone` | Phone number | Telephone | Required; format gently without rejecting normal punctuation |
| `service_type` | Which service would you like to request? | Single select | Required; preselected when opened from a service card |
| `requested_start_at` | What appointment date and time would you prefer? | Date and time | Required; this is a request, not a confirmed appointment |
| `returning_client` | Have we worked together before? | Yes / No | Required; controls returning-client questions later |
| `how_heard` | How did you hear about me? | Single select | Required for new clients; automatically “Returning Client” for returning clients |
| `booking_notes` | Is there anything helpful for me to know about your request? | Long text | Optional |

Standard `how_heard` choices:

- Instagram
- Facebook
- In-store
- Referral
- Macy's event
- Other

### Conditional booking questions

| Condition | Field key | Question | Requirement / behavior |
|---|---|---|---|
| Women's Everyday or Full Closet Refresh | `age_range` | Which age range applies to you? | Required; includes “Prefer not to answer” |
| Either event service | `event_type` | What type of event are you shopping for? | Required |
| Either event service | `event_date` | When is the event? | Required; distinct from requested appointment date |

The event type and event date should be shown later in the Style Profile as existing information with an edit option, not collected as a second unrelated copy.

### Appointment status model

Minimum recommended values:

- `pending` — submitted, awaiting Kayla's response
- `change_proposed` — Kayla proposed a different appointment time
- `confirmed` — final date and time accepted
- `declined` — request cannot be accommodated
- `cancelled` — a previously confirmed appointment was cancelled
- `completed` — appointment occurred

Store `requested_start_at` and `confirmed_start_at` separately. Do not overwrite the client's original request when a different time is approved.

## 6. Shared Style Profile behavior

- Do not ask for name, phone, email, referral source, service, or requested appointment time again.
- Show the client's first name and confirmed appointment summary at the top.
- Use short sections with a progress indicator rather than one long page.
- Save progress between sections so a client can return to an unfinished profile.
- Allow Back and Continue without losing answers.
- Clearly label optional questions instead of forcing placeholder answers.
- For required fit questions, provide “Not sure” or “Not applicable” when appropriate.
- Enforce “choose up to 3” selections in the interface rather than relying only on instruction text.
- Preserve useful visual answer cards. Each visual option must also have a visible text label and accessible description.
- Use a confirmation screen after submission and let the client reopen the link to update answers until a defined cutoff.
- The database should store stable answer values separately from the displayed wording so copy can change later without corrupting reports.

## 7. Profile: Women's General — Under 40

**Internal type:** `under_40`  
**Based on:** Misses Client Details

### Section A — What you're looking for

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `shopping_for` | What are you shopping for? | Up to 3: Everyday Outfits, Workwear, Event, Vacation, Closet Reset, Other | Required; remove the duplicated copy at the end of the Microsoft Form |
| `shopping_for_details` | Tell me a little more about what you need. | Long text | Required |
| `top_styles` | Pick up to 3 styles that feel most like you. | Visual multi-select: Minimal, Statement, Sporty, Casual, Trendy, Feminine, Other | Required; enforce maximum 3 |
| `inspiration` | Do you have inspiration photos, a Pinterest board, or colors you want me to see? | Link plus optional image upload later | Optional |
| `feel_best_in` | What styles, colors, or silhouettes do you feel best in? | Long text | Required |
| `avoid` | Are there any styles, colors, or pieces you do not want to wear? | Long text | Required; “Nothing specific” is a valid answer |
| `metal_preference` | Which metal do you usually prefer? | Gold, Silver, Both, No preference | Optional |

### Section B — Fit and comfort

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `body_shape` | Which illustration most closely resembles your shape? | Visual single select: Hourglass, Pear, Apple, Rectangle, Inverted Triangle, Not sure | Required; save descriptive value rather than only `1`–`5` |
| `frustration` | What's been most frustrating about getting dressed lately? | Nothing to wear, Outfits don't feel put together, Struggle with fit, Don't know how to style what I have, Closet feels outdated, Other | Required |
| `difficulty_fitting` | Which areas are usually most difficult to fit? | Midsection, Chest, Hips, Arms, Length, No consistent difficulty, Other | Required multi-select |
| `shop_sizing` | Which sizing department usually works best for you? | Regular, Petite, Plus, Tall/Long, Not sure, Other | Required |
| `fabric_preference` | What tends to feel best on your body? | Structured, Stretchy, A mix, Not sure/open to both | Required |

### Section C — Sizes and silhouettes

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `top_size` | What top size do you usually wear? | XS, S, M, L, XL, XXL, Not sure, Other | Required |
| `top_fit_preference` | How do you usually like your tops to fit? | Visual multi-select: More fitted, Relaxed, Oversized, No preference | Required |
| `pant_size` | What pant size do you usually wear? | 00/1 through 16/17, Not sure, Other | Required |
| `pant_cut_preference` | Which pant cuts do you prefer? | Visual multi-select: Skinny, Straight, Bootcut, Boyfriend/Girlfriend, Wide Leg, Open to trying different cuts, Other | Required |
| `dress_size` | What dress size do you usually wear? | XS 0–2 through XL 16–18, Not sure, N/A, Other | Required |
| `dress_styles` | Which dress styles do you usually feel best in? | Visual multi-select: Bodycon, Shift, A-Line, Wrap, Shirt, Slip, Maxi, Not sure, Other | Show when dresses are relevant or client does not choose N/A |
| `shoe_size` | What shoe size do you usually wear? | 5–11 including half sizes, Not sure, Other | Required |
| `bra_size` | What bra size do you usually wear, if known? | Text | Optional |

### Section D — Final details

| Field key | Question | Input | Requirement / behavior |
|---|---|---|---|
| `changed_since_last_visit` | Have any of your sizes, preferences, or style changed since the last time we met? | Yes, No, Maybe | Only show to returning clients |
| `additional_notes` | Is there anything else you'd like me to know before our appointment? | Long text | Optional |

## 8. Profile: Women's General — 40 or Older

**Internal type:** `over_40`  
**Based on:** Womens Client Details

### Section A — What you're looking for

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `shopping_for` | What are you shopping for? | Up to 3: Everyday, Business Casual, Workwear, Date Night, Closet Update, Vacation, Other | Required; remove duplicated ending questions |
| `shopping_for_details` | Tell me a little more about what you're looking for. | Long text | Required |
| `top_styles` | Pick up to 3 styles that feel most like you. | Visual multi-select: Classic, Sporty, Bold, Minimal, Trendy, Athletic, Casual, Other | Required; enforce maximum 3 |
| `inspiration` | Do you have inspiration photos, a Pinterest board, or colors you want me to see? | Link plus optional image upload later | Optional |
| `feel_best_in` | What styles, colors, or pieces do you feel best in? | Long text | Required |
| `avoid` | Are there any styles, colors, or pieces you do not want to wear? | Long text | Required; “Nothing specific” is valid |
| `frustration` | What's been most frustrating about getting dressed lately? | Nothing to wear, Closet feels outdated, Struggle with fit, Don't know how to put outfits together, Size has changed, Other | Required |
| `metal_preference` | Which metal do you usually prefer? | Gold, Silver, Both, No preference, Other | Optional |

### Section B — Fit and comfort

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `body_shape` | Which illustration most closely resembles your shape? | Visual single select: Hourglass, Pear, Apple, Rectangle, Inverted Triangle, Not sure | Required |
| `difficulty_fitting` | Which areas are usually most difficult to fit? | Midsection, Chest, Hips, Arms, Length, General sizing, No consistent difficulty, Other | Required multi-select |
| `shop_sizing` | Which sizing department usually works best for you? | Regular, Petite, Plus, Tall/Long, Not sure, Other | Required; replace the current confusing “Length (petite/tall)” answer |
| `fabric_preference` | What tends to feel best on your body? | Structured, Stretchy, A mix, Not sure/open to both, Other | Required |

### Section C — Sizes and silhouettes

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `top_size` | What top size do you usually wear? | Text with examples | Required; keep flexible rather than forcing a limited range |
| `top_fit_preference` | How do you usually like your tops to fit? | Visual multi-select: More fitted, Relaxed, Oversized, No preference | Required |
| `neckline_preference` | Do you have a preferred neckline? | Scoop, Round, V-Neck, Higher V-Neck, Boat, No preference, Other | Optional |
| `pant_size` | What pant size do you usually wear? | Text with examples | Required |
| `pant_cut_preference` | Which pant cuts do you prefer? | Visual multi-select: Skinny, Straight, Bootcut, Boyfriend/Girlfriend, Wide Leg, Open to trying different cuts, Other | Required |
| `dress_size` | What dress size do you usually wear? | Text; allow N/A and Not sure | Required |
| `dress_styles` | Which dress styles do you usually feel best in? | Visual multi-select: Bodycon, Shift, A-Line, Wrap, Shirt, Slip, Maxi, Not sure, Other | Conditional when dresses are relevant |
| `shoe_size` | What shoe size do you usually wear? | Text; allow Not sure | Required |
| `bra_size` | What bra size do you usually wear, if known? | Text | Optional |

### Section D — Final details

| Field key | Question | Input | Requirement / behavior |
|---|---|---|---|
| `changed_since_last_visit` | Have your preferences, style, or sizes changed since the last time I saw you? | Yes, No, Maybe | Only show to returning clients |
| `additional_notes` | Is there anything else you'd like me to know before our appointment? | Long text | Optional |

## 9. Profile: Women's Event & Occasion Styling

**Internal type:** `womens_event`  
**Based on:** Womens Event Styling Details

### Section A — Your event

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `event_type` | What type of event are you shopping for? | Wedding Guest, Wedding Party, Gala/Formal Event, Cocktail/Holiday Party, School Dance, Other | Required; prefilled from booking and editable |
| `event_date` | When is the event? | Date | Required; prefilled from booking and editable |
| `event_location` | Where is the event taking place? Is it indoors or outdoors? | Long text | Required |
| `dress_code` | What is the dress code, if you know it? | Visual single select: Casual, Dressy Casual, Business/Professional, Cocktail, Semi-Formal, Formal/Black Tie, Themed Event, Not sure, Other | Required |
| `event_details` | Tell me a little more about the event. | Long text | Optional |
| `required_colors_themes` | Are there required colors, themes, or dress guidelines? | Long text | Optional; “No” is sufficient |

### Section B — Styling goals

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `top_event_styles` | Pick up to 3 styles for your event look. | Visual multi-select: Classic Elegant, Romantic Feminine, Modern Minimal, Bold Statement, Trendy/Fashion Forward, Soft Glam, Polished Professional, Glam, Other | Required; enforce maximum 3 |
| `inspiration` | Do you have inspiration photos, a Pinterest board, or colors you want me to see? | Link plus optional image upload later | Optional |
| `feel_best_in` | What styles, colors, or silhouettes do you feel best in? | Long text | Required |
| `avoid` | Are there any styles, colors, or pieces you do not want to wear? | Long text | Required |
| `metal_preference` | Which metal do you usually prefer? | Gold, Silver, Both, No preference, Other | Optional |

### Section C — Outfit preferences and fit

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `body_shape` | Which illustration most closely resembles your shape? | Visual single select: Hourglass, Pear, Apple, Rectangle, Inverted Triangle, Not sure | Required |
| `outfit_types_open_to` | Which outfit types are you open to? | Dress, Jumpsuit, Skirt Outfit, Pants Outfit, Suit/Blazer Look, Not sure, Other | Required multi-select |
| `coverage_preference` | What level of coverage do you prefer? | Sleeveless is fine, Short sleeves, Longer sleeves, Minimal cleavage, Leg coverage, No preference, Other | Required multi-select; choices can coexist |
| `fabric_preference` | What tends to feel best on your body? | Structured, Stretchy, Flowy, A mix, Not sure, Other | Required multi-select |
| `difficulty_fitting` | Which areas are usually most difficult to fit? | Midsection, Chest, Hips, Arms, Length, No consistent difficulty, Other | Required multi-select |
| `shop_sizing` | Which sizing department usually works best for you? | Regular, Petite, Plus, Tall/Long, Not sure, Other | Required |

### Section D — Sizes

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `top_size` | What top size do you usually wear? | XS–XXL, Not sure, Other | Required |
| `top_fit_preference` | How do you usually like your tops to fit? | Visual multi-select: More fitted, Relaxed, Oversized, No preference | Required |
| `pant_size` | What pant size do you usually wear? | 00/1 through 18/19, Not sure, Other | Required |
| `pant_cut_preference` | Which pant cuts do you prefer? | Visual multi-select: Skinny, Straight, Bootcut, Cropped, Wide Leg, Open to trying different cuts, Other | Required |
| `dress_size` | What dress size do you usually wear? | XS 0–2 through XXL 18–20, Not sure, N/A, Other | Required |
| `dress_styles` | Which dress styles do you usually feel best in? | Visual multi-select: Bodycon, Fit and Flare, A-Line, Wrap, Slip, Mermaid Gown, Ballgown, Column, Not sure, Other | Show when client is open to a dress |
| `shoe_size` | What shoe size do you usually wear? | 5–11 including half sizes, Not sure, Other | Required |
| `shoe_type_preference` | Which shoe types are you open to? | High Heels 3\"+, Low Heels 2\"–3\", Flats, Dressy Sandals, Boots/Booties, Dressy Sneakers, Not sure, Other | Required multi-select; change current single-choice behavior so clients can select several |
| `bra_size` | What bra size do you usually wear, if known? | Text | Optional |

### Section E — Finishing touches

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `additional_help_interested` | What additional styling help would interest you? | Jewelry, Handbag/Clutch, Shapewear, Bra, Fragrance, Beauty, None, Other | Optional multi-select |
| `shopping_for_others` | Are you shopping for anyone else for this event? | No, Partner, Family member, Friend, Group, Other | Required |
| `additional_notes` | Is there anything else you'd like me to know before our appointment? | Long text | Optional |

## 10. Profile: Men's General Styling

**Internal type:** `mens_styling`  
**Used for:** Men's Everyday Styling and Men's Full Closet Refresh  
**Based on:** Mens Client Details

### Section A — What you're looking for

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `shopping_for` | What are you shopping for? | Up to 3: Everyday, Business Casual, Workwear, Date Night, Closet Update, Vacation, Other | Required; enforce maximum 3 |
| `shopping_for_details` | Tell me a little more about what you're looking for. | Long text | Required |
| `top_styles` | Pick up to 3 styles that feel most like you. | Visual multi-select: Casual, Modern, Trendy, Business Professional, Rugged, Athletic, Relaxed, Other | Required; enforce maximum 3 |
| `typical_week` | What does a typical week look like for you? | Mostly Casual, Business Casual, Professional Office, Active/Outdoors, Frequent Travel, Mix, Other | Required |
| `feel_best_in` | Are there styles, colors, or pieces you feel best in? | Long text | Required |
| `avoid` | Are there styles, colors, or pieces you do not want to wear? | Long text | Required |

### Section B — Fit and sizes

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `shop_sizing` | Which sizing department usually works best for you? | Regular, Big & Tall, Athletic/Modern, Not sure, Other | Required |
| `fit_preference` | What fit do you usually prefer? | Visual single select: Slim, Tailored, Modern, Classic, Relaxed, Not sure, Other | Required |
| `shirt_size` | What shirt size do you usually wear? | Text | Required |
| `dress_shirt_size` | What dress-shirt size do you usually wear? | Text; example `16 32/33`; allow Not sure | Required |
| `jacket_size` | What jacket size do you usually wear? | Text; example `40R`; allow Not sure | Required |
| `pant_size` | What pant size do you usually wear? | Text; example `36/34`; allow Not sure | Required |
| `shoe_size` | What shoe size do you usually wear? | Text; allow Not sure | Required |
| `additional_notes` | Is there anything else you'd like me to know before our appointment? | Long text | Optional |

## 11. Profile: Men's Event & Occasion Styling

**Internal type:** `mens_event`  
**Based on:** Mens Event Styling

### Section A — Your event

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `event_type` | What type of event are you shopping for? | Wedding Guest, Wedding Party, Business, Gala/Formal, School Dance, Other | Required; prefilled from booking and editable |
| `event_date` | When is the event? | Date | Required; prefilled from booking and editable |
| `event_location` | Where is the event taking place? Is it indoors or outdoors? | Long text | Required |
| `dress_code` | What is the dress code, if you know it? | Visual single select: Casual, Dressy Casual, Business/Professional, Semi-Formal, Formal/Black Tie, Not sure, Other | Required |
| `required_colors_themes` | Are there required colors, themes, or event guidelines? | Long text | Optional |

### Section B — Style and outfit direction

| Field key | Question | Input / choices | Requirement / behavior |
|---|---|---|---|
| `top_event_styles` | Pick up to 3 styles for your event look. | Visual multi-select: Classic, Modern, Trendy, Casual, Polished, Bold, Other | Required; enforce maximum 3 |
| `avoid` | Are there styles, colors, or pieces you do not want to wear? | Long text | Required |
| `outfit_types_open_to` | Which outfit types are you open to? | Polo, Dress Shirt, Sports Coat, Traditional Suit, 3-Piece Suit, Tuxedo, Not sure, Other | Required multi-select |
| `fit_preference` | What fit do you usually prefer? | Visual single select: Slim, Tailored, Modern, Classic, Relaxed, Not sure, Other | Required |
| `shop_sizing` | Which sizing department usually works best for you? | Regular, Big & Tall, Athletic/Modern, Not sure, Other | Required |

### Section C — Sizes

| Field key | Question | Input / behavior | Requirement / behavior |
|---|---|---|---|
| `shirt_size` | What shirt size do you usually wear? | Text | Required |
| `dress_shirt_size` | What dress-shirt size do you usually wear? | Text; example `16 32/33`; allow Not sure | Required |
| `jacket_size` | What jacket size do you usually wear? | Text; example `40R`; allow Not sure | Required |
| `pant_size` | What pant size do you usually wear? | Text; example `36/34`; allow Not sure | Required |
| `shoe_size` | What shoe size do you usually wear? | 8–12 including half sizes, Not sure, Other | Required; consider expanding range before launch |
| `additional_notes` | Is there anything else you'd like me to know before our appointment? | Long text | Optional |

## 12. Important corrections to Claude's proposed schema

1. `how_heard` belongs in booking, not inside all five Style Profiles.
2. Requested appointment time and confirmed appointment time must be separate values.
3. Event date is different from appointment date and must be retained separately.
4. Body shape should store descriptive values, not only the visual numbers `1`–`5`.
5. The duplicate shopping questions at the end of both general women's forms must be removed.
6. Returning-client change questions should be conditional rather than shown to everyone.
7. Inspiration links, bra size, and final notes should be optional despite being marked required in some current forms.
8. Event type should be required even though the existing Microsoft Forms do not consistently mark it required.
9. Visual choice cards are part of the intended experience and must be represented in the UX specification, not reduced to a plain database list.
10. Private Style Profile links require secure random tokens, expiration/revocation behavior, and protected API access; a booking ID alone must never grant access.

## 13. Open decisions before visual mockups

The durable engineering ledger is `docs/DECISIONS.md`. Decisions already approved there should not be redefined in this planning section.

### Resolved in `docs/DECISIONS.md`

- Booking request horizon: resolved.
- Requested appointment time count: resolved.
- Kayla-proposed alternate time flow: resolved.
- Client editing after Style Profile submission: resolved.
- First-release inspiration image handling: resolved.
- Written Style Profile history retention: resolved.
- Private Style Profile link expiration: resolved.

### Still open

- Should bra size be omitted entirely unless the client requests bra help?
- Should shoe-size ranges extend beyond the current form options?
- What privacy notice language should appear before submission?
- Should a repeat client receive a shorter update profile using saved prior answers in a later phase?

## 14. Recommended next sequence

1. Resolve the remaining open visual-mockup decisions above.
2. Create desktop and mobile wireframes for the booking request.
3. Create the shared multi-step Style Profile shell and one representative profile mockup.
4. Confirm the visual-card treatment, progress behavior, required fields, and mobile experience.
5. Finalize the database model and endpoint contract from the approved UX.
6. Implement booking submission and admin approval.
7. Implement confirmation, secure profile links, calendar options, and Style Profile submission.
8. Test accessibility, mobile behavior, failure states, and data export before public launch.
