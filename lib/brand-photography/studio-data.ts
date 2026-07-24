export type PhotographyModule = {
  id: string;
  type: "wardrobe" | "location" | "eyeContact" | "expression" | "camera" | "lighting" | "composition" | "hair";
  name: string;
  prompt: string;
};

export type PhotographyScene = {
  id: string;
  name: string;
  objective: string;
  intendedUse: string;
  story: string;
  emotions: string;
  avoid: string;
  defaults: Record<PhotographyModule["type"], string>;
};

export const PHOTOGRAPHY_MODULES: PhotographyModule[] = [
  { id: "OUT-R01", type: "wardrobe", name: "Structured Pink Statement Set", prompt: "Dress the subject in a structured bright-pink matching skirt set with polished feminine tailoring, a fitted cropped jacket with decorative metallic buttons, and a coordinating high-waisted skirt. Keep the look refined, youthful, polished, and distinctive." },
  { id: "OUT-R02", type: "wardrobe", name: "Romantic Ivory Blouse + Black Mini", prompt: "Dress the subject in an elegant ivory blouse with a polished collar, soft semi-sheer statement sleeves, structured cuffs, and delicate decorative fastening details. Pair it with a simple black mini skirt and sleek black knee-high boots." },
  { id: "OUT-R03", type: "wardrobe", name: "Black Sleeveless Top + Fuchsia Trousers", prompt: "Dress the subject in a refined black sleeveless top with subtle feminine detailing and high-waisted fuchsia wide-leg trousers with clean tailoring and fluid movement." },
  { id: "LOC-L01", type: "location", name: "Signature Styling Suite", prompt: "Use a warm-ivory styling suite with white-oak floors, an ivory bouclé chair, an arched full-length mirror, a refined clothing rack, soft neutral artwork, white florals, and linen curtains." },
  { id: "LOC-L02", type: "location", name: "Consultation Lounge", prompt: "Use comfortable lounge seating, a small marble or warm-stone table, a notebook or tablet, subtle coffee service, warm daylight, and restrained decor." },
  { id: "LOC-L03", type: "location", name: "Luxury Department Store", prompt: "Use a well-lit department-store environment with wide aisles, organized merchandising, premium fixtures, and minimal visible branding." },
  { id: "LOC-L05", type: "location", name: "Editorial Studio", prompt: "Use a warm-ivory, soft-taupe, or charcoal-gradient studio background with subtle depth. Keep all styling restrained so identity, expression, and wardrobe remain primary." },
  { id: "EXP-E01", type: "eyeContact", name: "Direct Connection", prompt: "Look directly into the camera with relaxed, confident eye contact that feels like genuine attention directed toward one future client." },
  { id: "EXP-E02", type: "eyeContact", name: "Listening", prompt: "Direct the eyes toward the client or conversation partner with a soft, attentive expression and slight forward engagement." },
  { id: "EXP-E03", type: "eyeContact", name: "Reviewing", prompt: "Direct the eyes naturally toward clothing, notes, a tablet, fabric, or another functional object with thoughtful concentration." },
  { id: "SMI-S01", type: "expression", name: "Signature Smile", prompt: "Use a warm, authentic, relaxed smile with naturally visible teeth and gently engaged eyes. Preserve the subject’s real smile shape and smile lines." },
  { id: "SMI-S02", type: "expression", name: "Listening Smile", prompt: "Use a subtle, encouraging smile that communicates patience and interest while another person is speaking." },
  { id: "SMI-S04", type: "expression", name: "Confident Neutral", prompt: "Use a soft closed-mouth expression with calm eyes, relaxed facial muscles, and no severity." },
  { id: "CAM-P85", type: "camera", name: "Commercial Portrait 85mm", prompt: "Render the image as photographed on a full-frame camera with an 85mm lens and an aperture appearance around f/2 to f/2.8, with realistic optical subject separation." },
  { id: "CAM-E50", type: "camera", name: "Environmental Portrait 50mm", prompt: "Render the image as photographed on a full-frame camera with a 50mm lens and an aperture appearance around f/2.4 to f/3.2, keeping important environmental details recognizable." },
  { id: "LGT-WIN", type: "lighting", name: "Bright Window + Studio Fill", prompt: "Use bright, soft, professionally diffused natural-window-inspired light with subtle invisible studio fill, warm-neutral daylight balance, soft catchlights, gentle shadows, and preserved texture." },
  { id: "CMP-CHEST", type: "composition", name: "Chest-Up Portrait", prompt: "Frame from the chest upward with generous headroom and the entire hairstyle visible. Avoid tight passport-style framing or awkward shoulder crops." },
  { id: "CMP-HERO", type: "composition", name: "Website Hero with Copy Space", prompt: "Place the subject intentionally off-center and preserve clean copy-safe negative space while keeping the subject emotionally engaging and the full hairstyle visible." },
  { id: "CMP-ENV", type: "composition", name: "Environmental Portrait", prompt: "Place the subject at approximately one-third of the frame while keeping her visually dominant. Include only the environmental details required to understand the story." },
  { id: "HAIR-BUN", type: "hair", name: "Signature High Curly Bun", prompt: "Style the hair in the subject’s signature high curly bun, preserving the approved silhouette, moderate volume, larger soft curl groupings, fewer isolated spiral ringlets within the bun, natural texture, and soft face-framing tendrils." },
  { id: "HAIR-DOWN", type: "hair", name: "Hair Down", prompt: "Wear the hair down while preserving the subject’s exact copper-red curl identity, natural volume, defined spiral ringlets, realistic texture, and natural movement." }
];

export const PHOTOGRAPHY_SCENES: PhotographyScene[] = [
  { id: "SC-001", name: "Signature Portrait", objective: "Become the defining image of Style with Kayla.", intendedUse: "Homepage, About, press, LinkedIn, and profile use.", story: "Direct visual connection with a future client.", emotions: "Trust, warmth, and competence.", avoid: "Generic headshot styling, cropped hair, fashion-model posing, and an overly formal expression.", defaults: { wardrobe: "OUT-R01", location: "LOC-L05", eyeContact: "EXP-E01", expression: "SMI-S01", camera: "CAM-P85", lighting: "LGT-WIN", composition: "CMP-CHEST", hair: "HAIR-BUN" } },
  { id: "SC-002", name: "Homepage Hero", objective: "Explain the brand within five seconds.", intendedUse: "Homepage hero and major campaign landing pages.", story: "A confident, welcoming stylist shown in an intentional working environment.", emotions: "Trust, approachability, and calm.", avoid: "The environment dominating the subject, excessive empty space, or a busy copy area.", defaults: { wardrobe: "OUT-R01", location: "LOC-L01", eyeContact: "EXP-E01", expression: "SMI-S01", camera: "CAM-E50", lighting: "LGT-WIN", composition: "CMP-HERO", hair: "HAIR-BUN" } },
  { id: "SC-003", name: "Executive Portrait", objective: "Support leadership, corporate, press, and partnership contexts.", intendedUse: "Press, speaking, partnerships, and business introductions.", story: "Quietly confident leadership without severe corporate styling.", emotions: "Confidence, intelligence, and professionalism.", avoid: "Masculine businesswear, power posing, severity, or dulling the pink outfit.", defaults: { wardrobe: "OUT-R01", location: "LOC-L05", eyeContact: "EXP-E01", expression: "SMI-S04", camera: "CAM-P85", lighting: "LGT-WIN", composition: "CMP-CHEST", hair: "HAIR-DOWN" } },
  { id: "SC-004", name: "Welcome Portrait", objective: "Make the viewer feel invited into a comfortable conversation.", intendedUse: "Booking, Contact, email, newsletter, and welcome messaging.", story: "Seated naturally and leaning slightly forward with open body language.", emotions: "Warmth, care, and approachability.", avoid: "Hand under chin, crossed arms, rigid posture, or a staged office setting.", defaults: { wardrobe: "OUT-R02", location: "LOC-L02", eyeContact: "EXP-E01", expression: "SMI-S01", camera: "CAM-P85", lighting: "LGT-WIN", composition: "CMP-CHEST", hair: "HAIR-BUN" } },
  { id: "SC-006", name: "Signature Working Stylist", objective: "Show Kayla actively prepared to help.", intendedUse: "Service pages, homepage support, marketing, and social.", story: "Hold coordinated garments naturally as part of an active styling moment.", emotions: "Competence, approachability, and confidence.", avoid: "Static stock-photo posing, merchandise presentation, malformed hangers, or malformed hands.", defaults: { wardrobe: "OUT-R03", location: "LOC-L03", eyeContact: "EXP-E03", expression: "SMI-S01", camera: "CAM-E50", lighting: "LGT-WIN", composition: "CMP-ENV", hair: "HAIR-BUN" } },
  { id: "SC-009", name: "Client Consultation", objective: "Demonstrate attentive, collaborative service.", intendedUse: "Booking, FAQ, appointment experience, and service pages.", story: "The client speaks while Kayla listens with slight forward engagement.", emotions: "Trust, attentiveness, and genuine care.", avoid: "The client becoming the hero, staged sales interaction, excessive distance, or fake note-taking.", defaults: { wardrobe: "OUT-R03", location: "LOC-L02", eyeContact: "EXP-E02", expression: "SMI-S02", camera: "CAM-E50", lighting: "LGT-WIN", composition: "CMP-ENV", hair: "HAIR-BUN" } }
];
