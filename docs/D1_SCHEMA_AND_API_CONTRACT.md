
## Women's unified Style Profile routing note

The `profile_type` column is text and supports the additional `womens_styling` value for new Women's Everyday Styling and Women's Full Closet Refresh bookings. Those new bookings may leave booking-level `age_range` null; existing `under_40`, `40_plus`, and `manual_review` booking-level values remain readable. No D1 migration is required for this TypeScript-only routing addition because no table or column shape changes are needed.
