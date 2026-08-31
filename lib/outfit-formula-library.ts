export type OutfitFormula = {
  id?: string;
  title: string;
  equation: string;
  whyItWorks: string;
  try: string;
  /** Retained when a legacy row is loaded so saving does not discard its original shape. */
  formulaText?: string;
  explanation?: string | null;
};

export type OutfitFormulaPresetGroup = {
  name: string;
  formulas: ReadonlyArray<Readonly<Omit<OutfitFormula, "id" | "formulaText" | "explanation">>>;
};

export const OUTFIT_FORMULA_PRESET_GROUPS: ReadonlyArray<OutfitFormulaPresetGroup> = [
  {
    name: "Everyday + Polished",
    formulas: [
      { title: "Elevated Denim", equation: "Elevated Top + Denim + Polished Shoe + Finishing Piece", whyItWorks: "An easy way to make denim feel intentional without losing comfort.", try: "Straight-leg jeans, a soft blouse, loafers, and simple jewelry." },
      { title: "Smart Casual", equation: "Polished Top + Relaxed Bottom + Structured Layer + Refined Shoe", whyItWorks: "Balances comfort and polish for days when you want to look put together without feeling overdressed.", try: "An elevated knit, ankle trousers, a lightweight blazer, and loafers." },
      { title: "Layered Neutrals", equation: "Neutral Base + Tonal Layer + Textural Contrast + Simple Accessories", whyItWorks: "Keeping the colors cohesive makes layering feel effortless, while texture gives the outfit depth.", try: "Cream trousers, an ivory knit, a camel cardigan, and gold jewelry." },
      { title: "Relaxed and Refined", equation: "Comfortable Base + Polished Piece + Soft Layer + Polished Shoe", whyItWorks: "Combines easy pieces with just enough structure to keep the outfit feeling intentional.", try: "Wide-leg trousers, a fitted tee, a soft cardigan, and ballet flats." },
      { title: "Effortless Weekend", equation: "Casual Bottom + Easy Top + Light Layer + Comfortable Shoe", whyItWorks: "A simple combination that feels relaxed but still looks pulled together.", try: "Straight-leg jeans, a striped tee, a denim jacket, and clean sneakers." },
      { title: "Simple Workwear", equation: "Work Trouser + Simple Top + Polished Layer + Professional Shoe", whyItWorks: "Creates an easy work uniform that can be repeated with different colors and pieces.", try: "Black ankle trousers, a knit shell, a blazer, and loafers." },
      { title: "Polished Layers", equation: "Simple Base + Mid-Layer + Structured Layer + Polished Shoe", whyItWorks: "Layering adds dimension while making a basic outfit feel more complete.", try: "A fitted tee, knit vest, straight-leg trousers, and loafers." },
      { title: "Desk to Dinner", equation: "Polished Base + Elevated Layer + Versatile Shoe + Statement Detail", whyItWorks: "Starts work-ready and adds just enough personality to transition easily into evening.", try: "Black trousers, a silky blouse, a blazer, pointed-toe flats, and statement earrings." },
    ],
  },
  {
    name: "Dresses + Occasion",
    formulas: [
      { title: "Easy Occasion Dressing", equation: "Elevated Separates + Dressy Shoe + Statement Accessory + Finishing Layer", whyItWorks: "An easy way to dress for celebrations and special plans without committing to a traditional occasion dress.", try: "A satin blouse, wide-leg trousers, heels, and statement earrings." },
      { title: "Easy Dress Formula", equation: "Versatile Dress + Intentional Shoe + Coordinated Accessory + Optional Layer", whyItWorks: "One strong dress does most of the work, making this one of the easiest ways to create a complete outfit.", try: "A midi shirt dress, ballet flats, a structured bag, and simple jewelry." },
      { title: "Jumpsuit Formula", equation: "Jumpsuit + Waist-Defining or Statement Accessory + Polished Shoe + Finishing Piece", whyItWorks: "A jumpsuit creates an instant head-to-toe look, so only a few finishing details are needed.", try: "A wide-leg jumpsuit, a waist-defining belt, block heels, and gold earrings." },
      { title: "Matching Set", equation: "Coordinated Top + Matching Bottom + Simple Shoe + Minimal Accessories", whyItWorks: "Matching pieces create instant polish while still giving you separates that can be styled again later.", try: "A knit top and matching wide-leg pants with sleek sneakers and simple jewelry." },
      { title: "Formal", equation: "Formal Silhouette + Refined Shoe + Elegant Accessories + Evening Layer", whyItWorks: "Starting with the right silhouette establishes the dress code, while refined accessories complete the look without competing with it.", try: "A floor-length gown, delicate heels, a clutch, and understated jewelry." },
      { title: "Semi-Formal", equation: "Elevated Dress or Separates + Dressy Shoe + Polished Accessories + Optional Layer", whyItWorks: "The right balance of elevated pieces creates a special-occasion look without requiring full formalwear.", try: "A midi dress, block heels, a structured clutch, and simple earrings." },
      { title: "Cocktail", equation: "Statement Base + Dressy Shoe + Evening Accessory + Finishing Detail", whyItWorks: "Cocktail dressing leaves room for personality while still feeling polished and event-ready.", try: "A fitted midi dress, strappy heels, a small clutch, and statement earrings." },
    ],
  },
];

export const blankOutfitFormula = (): OutfitFormula => ({ title: "", equation: "", whyItWorks: "", try: "" });

export function copyOutfitFormulaPreset(preset: OutfitFormulaPresetGroup["formulas"][number]): OutfitFormula {
  return { ...preset };
}
