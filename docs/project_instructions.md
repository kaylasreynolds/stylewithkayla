# project_instructions.md

**Version:** 2.0  
**Last Updated:** July 23, 2026

---

# Purpose

This document defines the day-to-day development standards, implementation workflow, project goals, and AI collaboration guidelines for the Style with Kayla project.

Unlike `DECISIONS.md`, this document is expected to evolve throughout development as workflows improve, tooling changes, and new implementation standards are adopted.

When beginning work on any feature, contributors should review this document together with the supporting documentation referenced below.

---

# Project Overview

Style with Kayla is a unified web application that combines:

- Public marketing website
- Appointment booking
- Style Profile system
- Client preparation workflow
- Administrative dashboard
- Future client resources and guides

The goal is to create a cohesive experience that feels personal, approachable, and effortless while remaining technically robust and easy to maintain.

---

# Documentation Hierarchy

Use the following documentation according to its area of responsibility.

| Document | Purpose |
|----------|---------|
| `DECISIONS.md` | Approved architectural, product, and engineering decisions. |
| `project_instructions.md` | Development workflow, implementation standards, AI collaboration, and project priorities. |
| `WEBSITE_DESIGN_SYSTEM.md` | Website UI/UX, layout, typography, responsive behavior, accessibility, and component standards. |
| `visual_guidelines/` | Visual identity, brand photography, prompt architecture, image quality standards, scene definitions, and asset management. |
| `D1_SCHEMA_AND_API_CONTRACT.md` | Database schema, API contracts, persistence, and validation. |
| `OPERATIONS.md` | Deployment, infrastructure, maintenance, backups, and recovery procedures. |
| GitHub Issues & Milestones | Active implementation backlog, phased work, and future enhancements. |

When documentation overlaps, contributors should reference the specialized document rather than duplicate its contents.

---

# Development Philosophy

Every implementation should prioritize:

- Simplicity
- Reliability
- Maintainability
- Accessibility
- Performance
- Long-term consistency

Avoid unnecessary complexity when an existing system already solves the problem.

---

# Visual Guidelines

The repository contains a dedicated `/docs/visual_guidelines/` directory that serves as the authoritative source for the Style with Kayla visual identity system.

This directory governs all standards related to branding imagery, whether assets are AI-generated, professionally photographed, or produced through future creative workflows.

Rather than duplicating visual standards throughout the repository, contributors should reference the appropriate document within this directory when creating, reviewing, editing, or approving visual assets.

The directory currently contains documentation covering:

- Brand photography philosophy and creative direction
- Permanent identity preservation and prompt foundation
- Reusable wardrobe, environment, expression, camera, lighting, and composition modules
- Approved scene definitions and intended image usage
- Prompt-build validation and testing
- Asset cataloging, review standards, and quality assurance

These documents collectively define the visual language of the Style with Kayla brand and should be treated as the single source of truth for all branding imagery.

Future additions—including brand video, illustration standards, iconography, motion guidance, and seasonal campaign direction—should also reside within this directory.

---

# Development Workflow

Every significant feature should follow this workflow:

1. Review existing documentation.
2. Review applicable GitHub Issues and Milestones.
3. Create desktop and mobile mockups when appropriate.
4. Review UX before implementation.
5. Implement incrementally.
6. Test desktop and mobile behavior.
7. Verify accessibility.
8. Review against project standards.
9. Commit only after approval.

---

# GitHub Workflow

GitHub serves as the project's active implementation backlog.

Use Issues and Milestones to organize:

- Features
- Enhancements
- Bugs
- Future ideas
- Implementation phases

Large features should be broken into logical milestones whenever practical.

---

# AI Collaboration Guidelines

AI assistants working on this repository should:

- Review existing documentation before proposing changes.
- Respect established architectural decisions.
- Reuse existing systems whenever possible.
- Prefer refinement over redesign.
- Minimize regressions.
- Keep documentation synchronized with implementation.
- Clearly distinguish permanent standards from implementation suggestions.

AI should avoid introducing new architectural patterns without considering existing project decisions.

---

# UI & UX Expectations

Interfaces should:

- Minimize cognitive load.
- Guide users naturally.
- Reduce booking friction.
- Maintain consistent spacing and typography.
- Feel calm, modern, and welcoming.
- Perform well on desktop and mobile.

When evaluating UI changes, prioritize usability over visual novelty.

---

# Booking Standards

The booking experience should:

- Require as few steps as practical.
- Preserve user context between pages.
- Reduce unnecessary decisions.
- Use conversational language.
- Reinforce trust throughout the process.

Changes to booking should be reviewed for both usability and conversion impact before implementation.

---

# Style Profile Standards

The Style Profile should function as a conversation rather than a questionnaire.

Questions should:

- Build naturally on previous responses.
- Avoid unnecessary repetition.
- Reduce decision fatigue.
- Help Kayla prepare effectively.
- Feel supportive rather than clinical.

---

# Documentation Standards

When a permanent decision is made:

- Update `DECISIONS.md` if the decision changes project architecture or long-term direction.
- Update `project_instructions.md` if implementation guidance changes.
- Update specialized documentation when changes affect a specific domain.
- Avoid duplicating information that already exists in an authoritative document.

Documentation should remain concise, maintainable, and organized by responsibility.

---

# Code Quality Expectations

Before considering work complete, verify that:

- Existing functionality is preserved.
- Responsive layouts remain intact.
- Accessibility has not regressed.
- Performance is maintained.
- Documentation reflects implementation.
- No unnecessary complexity has been introduced.

---

# Current Priorities

Current project priorities include:

1. Completing the unified booking experience.
2. Refining the administrative dashboard.
3. Expanding the Style Profile workflow.
4. Building the Resource Library.
5. Continuing the Brand Photography System.
6. Improving mobile usability.
7. Optimizing performance and accessibility.

---

# Before Committing

Before committing code:

- Confirm the implementation satisfies the approved design.
- Verify documentation is current.
- Test desktop and mobile layouts.
- Confirm no unrelated functionality has changed.
- Ensure changes align with existing project architecture.

When uncertain, favor incremental improvements over broad refactoring.