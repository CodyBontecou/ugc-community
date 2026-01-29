// Predefined niches for creator categorization
export const NICHES = [
  "beauty",
  "fashion",
  "tech",
  "lifestyle",
  "food",
  "fitness",
  "travel",
  "gaming",
  "parenting",
  "home",
  "pets",
  "finance",
  "health",
  "automotive",
  "sports",
  "entertainment",
] as const;

export type Niche = (typeof NICHES)[number];

// Display labels for niches
export const NICHE_LABELS: Record<Niche, string> = {
  beauty: "Beauty",
  fashion: "Fashion",
  tech: "Tech",
  lifestyle: "Lifestyle",
  food: "Food & Drink",
  fitness: "Fitness",
  travel: "Travel",
  gaming: "Gaming",
  parenting: "Parenting",
  home: "Home & Decor",
  pets: "Pets",
  finance: "Finance",
  health: "Health & Wellness",
  automotive: "Automotive",
  sports: "Sports",
  entertainment: "Entertainment",
};

// Rate ranges for filtering
export const RATE_RANGES = ["budget", "mid", "premium"] as const;

export type RateRange = (typeof RATE_RANGES)[number];

// Display labels for rate ranges
export const RATE_RANGE_LABELS: Record<RateRange, string> = {
  budget: "Budget-Friendly",
  mid: "Mid-Range",
  premium: "Premium",
};

// Rate range descriptions
export const RATE_RANGE_DESCRIPTIONS: Record<RateRange, string> = {
  budget: "Great for startups and small businesses",
  mid: "Balanced quality and value",
  premium: "Top-tier creators with proven track records",
};

// Sort options for directory listing
export const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Recently Joined" },
  { value: "alphabetical", label: "Alphabetical" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

// Default pagination
export const DEFAULT_PAGE_SIZE = 24;
