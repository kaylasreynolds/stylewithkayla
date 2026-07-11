# PROJECT_INSTRUCTIONS.md

Version: 1.1  
Last Updated: July 10, 2026

---

# Purpose and Document Hierarchy

Style With Kayla is the client-facing website for Kayla Reynolds, a Personal Stylist at Macy's in Boise, Idaho.

This file is the primary guide for:

- Business goals
- Brand voice
- Client experience
- Project workflow
- Current priorities
- Major project decisions

For visual design, layout, components, responsive behavior, and front-end standards, follow:

`docs/WEBSITE_DESIGN_SYSTEM.md`

If the two documents appear to conflict, this file governs brand voice, business priorities, and client experience. The design system governs visual implementation.

---

# Project Mission

Create a polished, approachable styling experience that feels personal, prepared, and easy to use.

Every decision should help clients feel confident, clear, and taken care of before they arrive at Macy's.

The website should gradually become the central client destination for:

- Learning about styling services
- Booking appointments
- Preparing for appointments
- Completing Style Profiles
- Viewing appointment details and resources
- Contacting Kayla
- Returning for future needs

The website is the client-facing experience. Clientele remains the internal CRM and relationship-management system.

---

# Brand Personality

Style With Kayla should feel:

- Warm
- Practical
- Encouraging
- Polished
- Genuine
- Organized
- Calm
- Personal
- Fun in small, natural moments

It should never feel:

- Pushy
- Sales-heavy
- Corporate
- Intimidating
- Fashion-snobby
- Overly formal
- Generic

The overall impression should be a helpful, organized friend who also happens to be a knowledgeable stylist.

---

# Writing Style

Write like Kayla speaks.

Prioritize:

- Clear language
- Short, useful paragraphs
- Practical guidance
- Confidence-building language
- Natural warmth
- Direct next steps
- Light personality when appropriate

Avoid:

- Fashion jargon
- Corporate language
- Luxury buzzwords
- Over-explaining
- Repetitive reassurance
- Pressure tactics
- Long lists of examples when one clear sentence will do

The client should feel like Kayla is speaking directly to them.

Approved messaging includes:

- “Style that feels effortless, polished, and completely you.”
- Practical outfit ideas
- Support built around the client’s life, needs, and budget
- “I help women and men simplify shopping, build complete outfits, and feel more confident in what they wear.”
- “We can narrow, compare, pause, or change direction at any point.”
- “Already know what you need? I’ll help you get there efficiently. Not sure where to start? I’ll ask the right questions and build a direction for you.”

Avoid phrases such as:

- “Style words”
- “Fashion terminology”
- Language that implies clients must understand fashion before booking

---

# Client Experience Principles

## Reduce Friction

Every page should answer the client’s next question before they need to ask it.

Common questions include:

- Can Kayla help me?
- Which appointment fits my needs?
- What happens next?
- Where do I go?
- How do I contact Kayla?

## One Primary Goal

Every page should have one primary goal and a clearly ranked set of supporting actions.

A page may include several useful actions, but the main next step should always be obvious.

## Show and Explain in Balance

Use photography, graphics, icons, cards, and layout to reduce unnecessary reading.

Do not remove information a client needs to:

- Make a decision
- Complete a form
- Prepare for an appointment
- Find the location
- Understand an offer or policy

## Warm Over Clever

Choose clear, human wording over clever marketing language.

## Practical Over Performative

The website should demonstrate care through preparation, useful details, and clear choices—not through repeated claims that the experience is personalized or pressure-free.

---

# Page Goals

## Homepage

Primary question:

> Can Kayla help me?

The homepage should introduce the experience, create trust, and guide visitors toward services, contact, or booking.

It should not explain every service in full.

## About Page

Primary question:

> Do I trust and like Kayla?

The page should include Kayla’s thoughtful, organized side and her fun, silly, approachable personality.

## Service Pages

Primary question:

> Which kind of help is right for me?

Service pages may explain in more detail than the homepage.

## Appointment Experience

Primary question:

> What happens next?

The appointment hub should make the next steps obvious and keep appointment information in one place.

## Style Profiles

Primary question:

> What does Kayla need to know so she can prepare?

Style Profiles should feel conversational, mobile-friendly, and visually engaging—not like paperwork.

## Resource Library

Primary question:

> How can Kayla continue helping me?

Resources should support appointments, repeat visits, and practical style decisions.

---

# Client Journey

Discover  
↓  
Learn  
↓  
Book  
↓  
Prepare  
↓  
Appointment  
↓  
Follow Up  
↓  
Return

Each page or feature should support at least one stage of this journey.

---

# Workflow

## Full Workflow: New Pages and Major Features

Use the full workflow for:

- New pages
- Major sections
- New forms or tools
- Booking and appointment flows
- Significant interaction changes
- Features likely to span multiple sessions

Process:

1. Create desktop and mobile mockups.
2. Revise until the direction is approved.
3. Build the approved design.
4. Refine copy so it sounds like Kayla.
5. Review UX, mobile behavior, accessibility, consistency, and performance.
6. Ship and close the related GitHub Issue.

Do not redesign the layout while coding unless a technical or accessibility issue requires it.

## Lightweight Workflow: Small Changes

Small maintenance edits may move directly to implementation and review.

Examples:

- Typos
- Link corrections
- Event date updates
- Minor spacing adjustments
- Image swaps
- One-line CSS fixes
- Small copy refinements

These do not require a mockup or separate GitHub Issue unless tracking would be useful.

---

# GitHub Issue Guidelines

Create a GitHub Issue for:

- New pages
- New features
- Multi-step improvements
- Bugs that may take more than one session
- Work that requires design, copy, and development
- Ideas that should be saved for later

A separate issue is usually unnecessary for:

- Minor copy changes
- Small CSS corrections
- Routine content updates
- Broken-link fixes
- Simple image replacements

GitHub Issues are the project backlog, not a log of every tiny edit.

---

# Current Design Decisions

- Keep the homepage hero headline: “Style that feels effortless, polished, and completely you.”
- Keep the section title: “A Simple, Personalized Experience.”
- Homepage content should introduce; service pages should explain.
- Keep the three primary service cards concise.
- Add one full-width section beneath the service cards for additional ways Kayla can help.
- Use “free styling appointment” for primary CTAs.
- Use “complimentary” in supporting copy when appropriate.
- Standard CTA: “Book a Free Styling Appointment.”
- Questionnaires are called “Style Profiles.”
- Replace Microsoft Forms as a high priority.
- The Appointment Hub and Style Profiles should be designed as one connected experience.
- Clientele remains the internal CRM.
- Microsoft Bookings may be replaced later, but Style Profiles and appointment confirmation are the immediate priorities.
- Public navigation should remain simple. Style Profiles should be introduced within the appointment journey, not as a primary navigation section.
- Use real testimonials only. Hide placeholder testimonials.

---

# Current Priorities

## Priority 1 — Public Website

- Homepage refinement
- About page personality and copy
- Women’s Styling
- Men’s Styling
- Events & Occasion Styling
- Macy’s Events

## Priority 2 — Appointment Experience and Style Profiles

- Your Appointment hub
- Women’s Style Profile
- Profile completion experience
- Men’s Style Profile
- Event Style Profile
- Bra Fit Profile
- Replace Microsoft Forms

## Priority 3 — Booking Experience

- Appointment selection
- Booking flow
- Replace Microsoft Bookings over time
- Calendar integration

## Priority 4 — Client Resources

- Resource library structure
- Color guides
- Body shape guides
- Style guides
- Outfit inspiration
- Appointment preparation resources

## Priority 5 — Optimization

- Photography
- Testimonials
- SEO
- Accessibility review
- Performance
- Analytics

---

# Working Rules for Future AI Assistance

Before making recommendations or changes:

1. Read this file.
2. Read `docs/WEBSITE_DESIGN_SYSTEM.md` for visual and front-end standards.
3. Review the existing page or code before proposing a redesign.
4. Respect approved decisions unless there is a clear usability, accessibility, technical, or business reason to change them.
5. Prefer refinement over reinvention.
6. Provide the requested deliverable instead of repeatedly describing future work.
7. Use the full mockup workflow only when the scope justifies it.
8. Prioritize completed, useful features over additional planning documents.
9. Use `components/site-footer.html` as the canonical footer for every public page. New pages must begin with that footer unchanged, and footer updates must be applied to the canonical component and every existing public page in the same change.

When a decision is unclear, ask:

- Does this make the client experience easier?
- Does this reduce uncertainty?
- Does this sound like Kayla?
- Does this support booking, preparation, trust, or repeat relationships?

The goal is a cohesive client experience—not a collection of disconnected pages or tools.
