# Style with Kayla Website Design System

Version: 1.1  
Last Updated: July 10, 2026

---

# Purpose and Document Hierarchy

This document is the source of truth for visual design and front-end implementation standards across the Style with Kayla website.

It governs:

- Color
- Typography
- Layout
- Spacing
- Components
- Responsive behavior
- Accessibility
- Front-end consistency

For business goals, brand voice, client experience, workflow, and current priorities, follow:

`docs/project_instructions.md`

This design system supports—but does not override—the project instructions.

Maintain consistency before introducing new visual patterns.

---

# Visual Direction

The website should feel:

- Polished
- Approachable
- Calm
- Spacious
- Editorial-inspired
- Modern
- Feminine without feeling overly delicate
- Professional without feeling corporate
- Personal rather than template-like

The experience should not resemble a busy department-store website.

It should feel like entering a thoughtfully prepared personal styling space: welcoming, organized, visually refined, and easy to navigate.

Avoid:

- Clutter
- Harsh contrast used without purpose
- Overly decorative layouts
- Fashion-industry pretension
- Generic template patterns
- Heavy shadows
- Cartoonish icons
- Visual effects that compete with the content

---

# Design Principles

## 1. Simplicity

Reduce unnecessary visual noise and competing calls to action.

## 2. Breathing Room

Use generous spacing to improve hierarchy and comfort, but do not add space merely to make a page longer.

Prioritize balanced rhythm, readability, and page length.

## 3. Consistency

Reuse established components, spacing values, and layout patterns.

## 4. Hierarchy

Guide attention through typography, spacing, imagery, and color.

## 5. Visual Support

Photography and graphics should support understanding and brand connection.

On marketing and storytelling pages, photography may lead the composition.

On task-based pages—including forms, appointment hubs, booking, directions, and calendars—clarity and usability take priority over photography.

## 6. Calm Interaction

Avoid anything that feels visually overwhelming, rushed, or distracting.

---

# Color Palette

## Primary Rose

`#CF8C93`

Use for:

- Primary buttons
- Links
- Active navigation
- Icons
- Small decorative accents
- Section labels
- Focused promotional highlights

Avoid using Primary Rose as the dominant background across large portions of a page.

It may be used for a contained callout or promotional section when contrast remains accessible.

## Rose Hover

`#BE747E`

Use for:

- Hover states
- Active states
- Interactive emphasis

## Warm Ivory

`#FCF9F6`

Primary website background.

Use for:

- Body
- Hero sections
- Navigation
- Footer
- Standard content sections

## Soft Blush

`#F6EEEB`

Use for:

- Alternate sections
- Featured content
- Background separation
- Testimonial sections
- Soft callouts

## Pale Rose

`#F1E1DE`

Use sparingly for:

- Decorative gradients
- Soft image overlays
- Icon backgrounds
- Small accent panels

## White

`#FFFFFF`

Use for:

- Cards
- Forms
- Elevated containers
- Dialogs
- Content panels

## Rich Charcoal

`#1F1F1F`

Use for:

- Headlines
- Navigation
- Icons
- High-emphasis text
- Announcement bar

## Warm Gray

`#5A5552`

Use for:

- Paragraphs
- Supporting copy
- Descriptions
- Footer text
- Secondary labels

## Divider

`#DDD2CA`

Use for:

- Borders
- Vertical dividers
- Input outlines
- Subtle horizontal rules

Keep borders understated.

---

# Color Balance

Use these percentages as a general visual guide, not a rigid formula:

- Warm Ivory: approximately 45%
- White: approximately 25%
- Soft Blush: approximately 15%
- Warm Gray: approximately 8%
- Primary Rose: approximately 5%
- Rich Charcoal: approximately 2%

The overall appearance should remain light, warm, and airy.

Pink should act primarily as an accent and point of focus.

---

# Typography

## Heading Font

Cormorant Garamond

Use for:

- Hero headings
- Section headings
- Page titles
- Card titles
- Selected footer headings

Recommended weights:

- 400
- 500
- 600
- 700 only where stronger emphasis is intentionally needed

## Body Font

Inter

Use for:

- Navigation
- Paragraphs
- Buttons
- Forms
- Labels
- Footer copy
- Contact information

Recommended weights:

- 400
- 500
- 600

## Typography Hierarchy

Use fluid, responsive sizing rather than fixed values everywhere.

Approximate desktop ranges:

- Hero heading: 64–84px
- Section heading: 44–56px
- Card title: 26–36px
- Navigation: 15–16px
- Body: 17–18px
- Footer: 15–16px
- Labels: 13–15px

Mobile body text should never be smaller than 16px.

Uppercase labels may use approximately `0.12em–0.15em` letter spacing.

Do not use uppercase for long sentences or paragraphs.

---

# Layout

## Width

- Maximum content width: 1280px
- Comfortable content width: 1180px

## Horizontal Padding

Suggested values:

- Desktop: 64px
- Tablet: 40px
- Mobile: 24px

Content should never touch the browser edge.

## Vertical Rhythm

Suggested major-section spacing:

- Desktop: approximately 110–120px
- Tablet: approximately 85–90px
- Mobile: approximately 64–70px

These values may be reduced when a page feels unnecessarily long or when sections are closely related.

Spacing should create hierarchy, not empty distance.

## Grid

- Align content to a consistent central grid.
- Keep card tops, bottoms, and internal spacing aligned where practical.
- Align buttons with surrounding content.
- Avoid unexplained width changes.
- Allow intentional asymmetry only when it improves the composition.

---

# Buttons

## Shape

- Fully rounded
- Recommended radius: `999px`

## Padding

Suggested default:

`16px 28px`

Adjust when necessary for responsive layouts or compact secondary actions.

## Primary Button

- Background: `#CF8C93`
- Text: white
- Hover: `#BE747E`

## Secondary Button

- Background: white or transparent
- Border: Primary Rose or subtle Divider
- Hover: Soft Blush

## Behavior

- Recommended transition: `250ms ease`
- Buttons should not feel oversized or bulky.
- Text should clearly state the action.
- Primary CTAs should be visually obvious.
- Preserve visible keyboard focus states.
- Touch targets should be at least approximately 44px high.

---

# Cards

Recommended default:

- Background: white
- Radius: 20px
- Border: very light
- Shadow: soft and subtle
- Hover: slight lift or shadow increase when the whole card is interactive
- Transition: `250ms ease`

Cards should feel structured and touchable without appearing heavy.

Do not add hover movement to static informational cards unless it communicates interactivity.

Reuse the established card structure before creating a new variation.

---

# Images and Photography

Use:

- Natural lighting
- Lifestyle moments
- Real interactions
- Editorial-inspired composition
- Minimal editing
- Neutral or visually calm environments
- Images that feel warm, human, and believable

Recommended corner radius:

- Approximately 20px, unless the existing component uses another approved radius

Photography should lead on:

- Homepage storytelling
- About pages
- Service introductions
- Event promotion

Photography should not displace essential controls or instructions on:

- Style Profiles
- Appointment hubs
- Forms
- Booking pages
- Directions
- Calendar actions

Optimize images before uploading and provide meaningful alternative text when the image conveys information.

---

# Icons

Use:

- Thin outline icons
- Simple shapes
- Consistent stroke weight
- Familiar symbols for task-based actions

Avoid:

- Filled icon sets mixed with outline icons
- Heavy icons
- Cartoon icons
- Decorative icons that reduce clarity

Do not rely on an icon alone when the action may be unclear; include a text label.

---

# Shadows and Borders

## Shadows

- Soft only
- Avoid dramatic depth
- Use elevation consistently

## Borders

- Prefer white space over excessive borders
- Use light borders to clarify cards, forms, or grouping
- Vertical footer dividers are part of the approved direction
- Avoid frequent horizontal rules unless they improve scanning

---

# Motion

Use subtle motion only.

Appropriate effects:

- Fade
- Fade up
- Small movement

Recommended maximum movement:

- Approximately 20px

Recommended duration:

- Approximately 300–600ms depending on the interaction

Avoid:

- Bounce
- Spin
- Elastic effects
- Slow animations that delay tasks
- Motion that competes with content

Honor reduced-motion preferences.

Motion should feel calm and unobtrusive—not “luxurious” for its own sake.

---

# Forms and Style Profiles

Inputs should feel clean, approachable, and easy to complete on a phone.

Recommended standards:

- Radius: approximately 14px
- Large click and tap areas
- Simple, visible labels
- Minimal but clear borders
- Consistent spacing
- Clear validation messages
- Visible focus states
- Plain-language instructions

For image-driven Style Profile choices:

- Make the selected state obvious without relying on color alone.
- Keep image grids easy to scan.
- Allow users to change their choices.
- Keep required information clear without making the experience feel like paperwork.
- Break long forms into logical steps when that reduces overwhelm.

---

# Navigation

Navigation should be:

- Light
- Minimal
- Balanced
- Easy to scan
- Consistent across public pages

Use one prominent primary CTA.

Navigation should never dominate the page.

Sticky behavior is optional and should be used only when it improves access without reducing usable screen space.

Public navigation should remain simple. Appointment-specific tools and Style Profiles should appear within the client journey rather than becoming unnecessary top-level links.

---

# Footer

Default direction:

- Light background
- Vertical dividers
- Simple organization
- Consistent typography
- Subtle icons
- Working links only

Avoid dark footers by default.

A darker treatment may be considered only when readability, contrast, and the balance of the full page clearly improve.

Do not display inactive social-media icons as though they are links.

---

# Responsive Design

Design both desktop and mobile intentionally.

For forms, booking, appointment hubs, and client tools, begin with mobile needs because clients are likely to use them on a phone.

For editorial marketing pages, establish a strong desktop composition and verify the mobile layout before approval.

Mobile requirements:

- No horizontal scrolling
- Natural stacking
- Easy-to-tap buttons and links
- Readable typography
- Full-width cards when appropriate
- Images that retain useful visual presence
- No content touching screen edges
- Clear navigation pattern

A hamburger menu may be used when the number or width of navigation links requires it; it is not mandatory when a simpler mobile pattern works better.

---

# Accessibility

Maintain:

- Sufficient color contrast
- Body text of at least 16px on mobile
- Visible focus states
- Appropriately sized touch targets
- Semantic headings
- Useful link and button labels
- Alternative text for meaningful images
- Keyboard-accessible interactions
- Error messages that explain how to fix the problem
- Reduced-motion support

Accessibility takes priority over decorative consistency.

---

# Component Philosophy

When creating new sections or pages:

1. Reuse an existing component when it serves the content.
2. Modify an existing component carefully when a new need is closely related.
3. Introduce a new pattern only when the existing system cannot support the experience clearly.

Avoid unnecessary new:

- Card styles
- Button styles
- Spacing systems
- Radius values
- Shadows
- Layout structures

Consistency is more valuable than variety, but usability is more important than rigid sameness.

---

# Implementation Rules

- Use CSS custom properties for approved colors, fonts, spacing, and radii.
- Avoid duplicate CSS declarations when a reusable class or variable can solve the need.
- Do not use inline styles unless a temporary or highly specific need justifies them.
- Keep responsive rules near the related component or organized consistently within the stylesheet.
- Do not change shared components to solve a single-page problem without checking the effect on every page.
- Test links, hover states, keyboard focus, and mobile layout after implementation.
- Match approved mockups for major work, while allowing technical adjustments required for accessibility and responsive behavior.

---

# Final Decision Order

When visual decisions compete, prioritize:

1. Usability
2. Accessibility
3. Consistency
4. Readability
5. Simplicity
6. Brand expression
7. Photography and decorative detail

The best solution should feel cohesive, timeless, approachable, and easy for the client to use.
