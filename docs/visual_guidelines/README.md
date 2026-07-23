# Visual Guidelines
Updated: July 23, 2026

## Purpose

The `visual_guidelines` directory contains the complete photography production system for the Style with Kayla brand.

Rather than storing individual prompts or images in one place, the system separates standards, reusable components, production planning, and digital assets into independent layers. This keeps the system scalable, maintainable, and easy to update as the image library grows.

---

# Documentation Structure

## BRAND_PHOTOGRAPHY_CONSTITUTION.md

Defines the permanent creative philosophy of the brand.

Answers:

> **Why should the photography look this way?**

Topics include:

- Brand philosophy
- Emotional goals
- Visual identity
- Wardrobe philosophy
- Environment philosophy
- Human connection
- Commercial photography standards

This document changes only when the brand itself evolves.

---

## PERMANENT_PROMPT_FOUNDATION.md

Defines the permanent technical production standard.

Answers:

> **How should every image be created?**

Topics include:

- Identity preservation
- Facial fidelity
- Hair standards
- Camera
- Lighting
- Composition
- Prompt architecture
- Quality standards
- Image rejection criteria

Every future prompt inherits this foundation.

---

## PHOTO_MODULE_LIBRARY.xlsx

The reusable building blocks used throughout the photography system.

Examples include:

- Wardrobe modules
- Hairstyles
- Expressions
- Poses
- Hand placement
- Lighting
- Camera profiles
- Composition
- Environments
- Props

Each module is intended to be reusable across many scenes.

---

## PHOTO_SCENE_REGISTRY.xlsx

The master production roadmap.

Every planned image should appear here.

Each scene defines:

- Purpose
- Intended website or marketing placement
- Required modules
- Priority
- Production status
- Associated assets

This document tracks what needs to be produced rather than how it is produced.

---

## PROMPT_BUILD_TEST_SET.md

The engineering validation document.

Each entry combines approved modules into a complete production prompt for testing.

Each prompt records:

- Modules used
- Complete assembled prompt
- Expected result
- QA notes
- Outcome
- Revisions

This document validates that the modular system produces consistent, production-quality images.

---

# Image Storage

This directory intentionally does **not** store the photography itself.

High-resolution images should never be embedded inside Markdown or Excel documents.

Instead, the photography system uses dedicated storage.

## Cloudflare R2

Stores the actual image files.

Examples:

- Identity references
- Hair references
- Approved production masters
- Generated candidates
- Production derivatives
- Archived assets

R2 is the permanent digital asset library.

---

## Cloudflare D1

Stores metadata about every image.

Examples:

- Asset IDs
- Reference IDs
- Scene IDs
- Storage locations
- QA status
- Approval history
- Version history
- Website usage
- Regeneration history

The database stores relationships—not image files.

---

# Relationship Between Systems

```
GitHub
│
├── Documentation
├── Standards
├── Prompt system
└── Production planning
        │
        ▼
Cloudflare D1
│
├── Metadata
├── Relationships
├── QA
└── Asset records
        │
        ▼
Cloudflare R2
│
├── Reference photography
├── Approved masters
├── Production images
└── Archived assets
```

---

# Design Principles

The photography system follows these principles.

- Documentation should never contain full-resolution image files.
- Images are referenced using stable IDs rather than embedded directly.
- One approved master image should exist for every final asset.
- Production images should be generated from approved masters rather than repeatedly edited.
- All standards are living documentation. Replace outdated guidance rather than appending revisions.
- Modules should be reusable across multiple scenes.
- Scenes should reference modules instead of duplicating prompt content.

---

# Long-Term Goal

The long-term objective is to create a fully modular photography system where:

- Brand philosophy remains stable.
- Prompt architecture remains stable.
- Modules can be expanded without affecting existing documentation.
- New scenes can be assembled from reusable modules.
- Every generated image can be traced from:
  - Constitution
  - Prompt Foundation
  - Modules
  - Scene
  - Prompt
  - Asset
  - Production usage

This creates a scalable commercial photography library capable of supporting hundreds of consistent brand images while maintaining identity, quality, and long-term maintainability.
