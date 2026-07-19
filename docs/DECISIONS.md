# Style With Kayla Engineering Decisions

This ledger is the durable source of approved product and engineering decisions for the booking and Style Profile build. Planning documents may summarize or link back here, but this file should remain the canonical record when policy-level details change.

| Public website deployment | The `main` branch is the unified production source for the public marketing website, booking application, Style Profile workflow, and administrative tools. Public marketing assets remain under `public/`, while dynamic booking and administrative routes are served through the Cloudflare Worker. Administrative routes are protected by Cloudflare Access. |

## Approved decisions

| Decision | Approved answer |
|---|---|
| Booking request horizon | Clients may request appointments up to 60 days in advance. |
| Requested appointment time | Clients submit one preferred appointment date and time per booking request. |
| Kayla-proposed alternate time flow | Kayla may respond with a proposed alternate appointment time; the request remains pending client acceptance until the client accepts the alternate or the request is otherwise declined/cancelled. |
| Submitted Style Profile editing | Once a Style Profile is submitted, client editing is locked. Any post-submission changes should be handled by Kayla/admin workflow rather than direct client edits. |
| Inspiration assets for first release | Defer image uploads for the first release; collect inspiration links instead. |
| Written Style Profile history retention | Retain written Style Profile history for two years. |
| Private Style Profile link expiration | Private Style Profile links expire 30 days after they are issued unless revoked earlier. |

## Unified women's styling Style Profile routing

Women's Everyday Styling and Women's Full Closet Refresh now create a `womens_styling` Style Profile at booking creation instead of collecting booking-step age routing. Age range, height, and weight are collected in the first Style Profile section, and age-specific women's questions are displayed conditionally from the saved `age_range` answer. Existing `under_40`, `over_40`, `womens_event`, `mens_styling`, and `mens_event` profiles remain supported for legacy links and records.
