{
  "id": "aa3ea7f8",
  "title": "Curated Google Fonts registry to prevent font hallucination and overuse",
  "tags": [
    "portfolio-generation",
    "priority-high",
    "design"
  ],
  "status": "open",
  "created_at": "2026-02-06T23:40:35.374Z"
}

## Overview
Provide Claude with a curated, validated list of distinctive Google Fonts organized by mood/category so it never hallucinates font names or falls back to overused defaults.

## Tasks
- Create `lib/agent/font-registry.ts` with:
  - A curated list of 80-100 high-quality Google Fonts
  - Each entry: `{ name, googleImportUrl, category, mood[], weight[] }`
  - Categories: display, serif, sans-serif, mono, handwritten
  - Moods: luxury, playful, editorial, tech, organic, retro, bold, elegant, minimal
  - Pre-validated import URLs (test each one works)
- Organize into recommended pairings (display + body combos that work well together)
- Add a `getRecommendedFonts(mood: string)` function that returns 5-8 suitable fonts for a given aesthetic
- Integrate with the design seed system — each seed references specific fonts from this registry
- Add the font list (or a filtered subset) to the system prompt so Claude picks from validated options
- Explicitly ban overused fonts in the prompt: Inter, Roboto, Arial, Open Sans, Lato, Montserrat, Space Grotesk

## Font Categories to Cover
- **Display/Headlines**: Playfair Display, Cormorant Garamond, Archivo Black, Poiret One, Bebas Neue, Abril Fatface, Righteous, Yeseva One, etc.
- **Body/Readable**: Source Serif Pro, Karla, Nunito Sans, DM Sans, Outfit, Plus Jakarta Sans, Lexend, etc.
- **Mono/Code**: JetBrains Mono, Fira Code, IBM Plex Mono, Space Mono, etc.
- **Character/Personality**: Satisfy, Pacifico, Caveat, Press Start 2P, etc.

## Files
- `lib/agent/font-registry.ts` (new)
- `lib/agent/design-seeds.ts` (modify — reference font registry)
- `lib/agent/portfolio-generator.ts` (modify — inject font info into prompt)

## Acceptance Criteria
- Claude always uses fonts from the registry (no hallucinated names)
- Every font import URL is validated and working
- No generation uses Inter, Roboto, Arial, or other banned defaults
- Fonts are diverse across generations
