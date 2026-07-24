# Hair Replacement Edit Workflow

## Purpose

Use this workflow when a generated image has an otherwise approved face, pose, wardrobe, lighting, composition, and environment, but the hairstyle must be replaced to match the approved signature high curly bun.

This is a separate editing workflow from the permanent generation foundation.

The permanent generation foundation is designed to preserve identity and natural curl characteristics. A corrective hair replacement edit has a different objective: it must preserve the person and the image while allowing the existing hairstyle geometry to be discarded and reconstructed from an authoritative hairstyle reference.

## Why the Current Hair Edit Can Fail

A prompt can become internally contradictory when it asks the editor to:

- replace the existing hairstyle;
- preserve the existing curl pattern, density, volume, and bun shape; and
- match a separate hairstyle reference exactly.

When the source image already contains a curly bun, the editor may interpret the preservation instructions as higher priority and make only minor adjustments. This produces another similar curly updo instead of reconstructing the approved bun.

The difficulty increases across newly generated images because each source image begins with different hair geometry, curl density, crown height, curl placement, and internal structure.

## Recommended Production Workflow

1. Generate the full brand image with the signature high curly bun requested from the beginning.
2. Prefer generations whose bun already matches the approved reference closely.
3. Use a corrective hair replacement edit only when the rest of the image is strong enough to preserve.
4. During the replacement edit, protect identity, face, hairline, pose, wardrobe, lighting, composition, background, hands, and jewelry.
5. Do not protect the current bun geometry, curl placement, internal curl distribution, or silhouette.
6. Use the hairstyle reference as the sole authority for the reconstructed hairstyle.
7. Reserve micro-refinement prompts for small changes such as reducing flyaways or adjusting one tendril.

## Instruction Priority for Hair Replacement

For this edit type, use the following hierarchy:

1. Preserve the subject's identity, facial anatomy, expression, skin rendering, and natural hairline.
2. Preserve every approved non-hair element of the source image.
3. Reconstruct the hairstyle from the attached approved hairstyle reference.
4. Preserve the subject's copper-red color and natural curly-hair identity while matching the reference geometry.
5. Do not preserve conflicting source-hair geometry.

## Canonical Hair Replacement Prompt

### Hair Replacement Only — Reconstruct from Approved Hairstyle Reference

Treat the existing image as the approved master photograph.

Apply a localized hair replacement only. Do not regenerate, reinterpret, repaint, enhance, or modify any area outside the hair.

Preserve the subject's exact identity, facial structure, facial proportions, expression, smile, smile lines, natural facial asymmetry, freckles, pores, skin texture, eye shape, eyelids, iris size, eyebrows, nose, lips, jaw, chin, ears, makeup, body proportions, pose, hands, engagement ring, jewelry, wardrobe, fabric texture, lighting, shadows, color balance, camera perspective, depth of field, composition, crop, environment, and background exactly as they appear in the approved master image.

Do not repaint the face. Do not synthesize new skin texture. Do not beautify, smooth, sharpen, reshape, relight, or increase perceived facial detail.

Use the attached approved hairstyle reference as the authoritative geometry for the entire hairstyle.

Reconstruct the hairstyle to match the reference rather than preserving or refining the current hairstyle. The current bun shape, curl placement, internal curl distribution, crown structure, volume distribution, and silhouette are not protected and must not be treated as constraints.

Only the subject's natural hairline, temple shape, baby hairs, natural density at the forehead, copper-red color identity, and naturally curly hair identity are protected.

Create the subject's signature high curly bun with the same:

- placement high on the crown;
- overall height and width;
- rounded, softly elongated silhouette;
- moderate volume and balanced proportions;
- crown lift and transition into the bun;
- larger, softer curl groupings;
- restrained internal curl complexity;
- loose, naturally gathered construction;
- realistic curl compression, depth, and shadow;
- authentic copper-red tonal variation and subtle highlights.

The bun must contain fewer visible individual spiral ringlets than the current hairstyle. Do not preserve the source image's small, dense, highly separated, or overly intricate ringlet pattern. Rebuild those areas as the larger, softer curl masses shown in the approved hairstyle reference.

Match the face-framing curls to the hairstyle reference:

- one primary tendril on each side;
- natural origin near the temples;
- relaxed spiral shape with realistic weight;
- matching length, curvature, placement, and visual balance;
- no extra forehead curls or excessive loose pieces.

The completed hairstyle should appear naturally created from the subject's own copper-red curls, but its visible geometry must come from the approved hairstyle reference rather than from the source image.

Do not:

- preserve the current bun merely because it is already curly;
- blend the source bun and reference bun into a compromise;
- create a similar or approximate curly updo;
- increase or decrease the approved reference volume;
- create many small ringlets throughout the bun;
- tighten the curl pattern;
- smooth the hair into a polished chignon;
- create a messy top knot;
- flatten the crown;
- change the hair color;
- alter the hairline;
- change any facial feature or non-hair detail.

The finished image must be visually indistinguishable from the approved master image outside the hair. The finished hairstyle must be visually indistinguishable from the attached approved hairstyle reference in silhouette, proportion, structure, volume distribution, curl grouping, bun shape, and face-framing placement.

## Use a Micro-Refinement Prompt Instead When

Use a smaller localized refinement rather than the full replacement prompt when the bun already matches the approved reference in silhouette and structure and only needs one limited correction, such as:

- reducing flyaways by approximately 10–15%;
- loosening one face-framing tendril;
- correcting one isolated curl;
- slightly reducing internal curl detail;
- correcting a small asymmetry without changing total volume.

Do not use the full replacement prompt for these small corrections because a structural reconstruction creates unnecessary risk to an otherwise approved image.
