// =====================================================
// Creator Archetype Detection
// =====================================================

export type CreatorArchetype =
  | "fashion-beauty"
  | "lifestyle-food"
  | "tech-gaming"
  | "family-kids"
  | "fitness-wellness"
  | "general";

// =====================================================
// Keyword Maps
// =====================================================

const ARCHETYPE_KEYWORDS: Record<Exclude<CreatorArchetype, "general">, string[]> =
  {
    "fashion-beauty": [
      "skincare",
      "makeup",
      "beauty",
      "fashion",
      "style",
      "outfit",
      "aesthetic",
      "glam",
      "cosmetics",
      "hair",
      "nails",
      "model",
      "runway",
      "look",
      "couture",
      "wardrobe",
      "accessory",
      "jewelry",
      "lipstick",
      "foundation",
      "serum",
      "glow",
      "contour",
      "palette",
    ],
    "lifestyle-food": [
      "recipe",
      "cooking",
      "food",
      "lifestyle",
      "home",
      "decor",
      "travel",
      "wellness",
      "vlog",
      "daily",
      "morning routine",
      "brunch",
      "baking",
      "restaurant",
      "kitchen",
      "interior",
      "apartment",
      "cozy",
      "cafe",
      "meal",
      "dinner",
      "lunch",
    ],
    "tech-gaming": [
      "tech",
      "gaming",
      "game",
      "software",
      "app",
      "gadget",
      "review",
      "unboxing",
      "pc",
      "console",
      "setup",
      "stream",
      "twitch",
      "esports",
      "developer",
      "code",
      "smartphone",
      "headset",
      "keyboard",
      "mouse",
      "gpu",
      "monitor",
    ],
    "family-kids": [
      "family",
      "kids",
      "children",
      "parenting",
      "mom",
      "dad",
      "baby",
      "toddler",
      "toys",
      "nursery",
      "school",
      "playground",
      "pregnancy",
      "motherhood",
      "fatherhood",
      "sibling",
      "family-friendly",
    ],
    "fitness-wellness": [
      "fitness",
      "workout",
      "gym",
      "health",
      "nutrition",
      "yoga",
      "training",
      "muscle",
      "diet",
      "wellness",
      "running",
      "crossfit",
      "protein",
      "cardio",
      "strength",
      "pilates",
      "meditation",
      "mindfulness",
      "exercise",
      "body",
      "weight",
    ],
  };

// =====================================================
// Detection Function
// =====================================================

export function detectArchetype(data: {
  portfolioVision: string;
  inspiringBrands?: string | null;
  niches?: string[] | null;
}): CreatorArchetype {
  // Build a combined text blob to search
  const parts: string[] = [data.portfolioVision.toLowerCase()];
  if (data.inspiringBrands) {
    parts.push(data.inspiringBrands.toLowerCase());
  }
  if (data.niches && data.niches.length > 0) {
    parts.push(data.niches.join(" ").toLowerCase());
  }
  const text = parts.join(" ");

  // Count keyword matches for each archetype
  const scores: Record<string, number> = {};

  for (const [archetype, keywords] of Object.entries(ARCHETYPE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      // Use word boundary matching for short keywords to avoid false positives
      if (keyword.length <= 3) {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        const matches = text.match(regex);
        if (matches) score += matches.length;
      } else {
        // Count all occurrences
        let idx = 0;
        while (true) {
          idx = text.indexOf(keyword, idx);
          if (idx === -1) break;
          score++;
          idx += keyword.length;
        }
      }
    }
    scores[archetype] = score;
  }

  // Find the archetype with the highest score
  let bestArchetype: CreatorArchetype = "general";
  let bestScore = 0;

  for (const [archetype, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestArchetype = archetype as CreatorArchetype;
    }
  }

  // Only return a specific archetype if we have meaningful matches
  if (bestScore < 2) {
    return "general";
  }

  return bestArchetype;
}
