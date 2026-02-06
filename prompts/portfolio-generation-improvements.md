# Portfolio Generation Improvements — Implementation Prompt

You are implementing a comprehensive set of improvements to the portfolio website generation pipeline for ugc.community. This is a Next.js app that generates unique, beautiful portfolio websites for UGC creators using Claude's API. The generation runs via an Inngest background job on a Fly.io worker.

Read every file referenced below before making changes. Understand the full pipeline first, then implement in order.

## Current Architecture (read these files first)

```
lib/agent/portfolio-generator.ts   — Main agentic loop: calls Claude API with tools (write_file, read_file, web_fetch, web_search), collects generated files
lib/agent/portfolio-prompt.ts      — Builds the user prompt from QuestionnaireData
lib/agent/favicon-generator.ts     — Generates favicons via Replicate SDXL
lib/inngest/functions/generate-portfolio.ts — Inngest function that orchestrates: load data → generate → upload → activate
lib/portfolio/storage.ts           — Uploads generated files to Vercel Blob
lib/portfolio/platform-injections.ts — Serve-time injections (tracking pixel, contact form handler)
lib/db/schema.ts                   — Database schema (Drizzle ORM, PostgreSQL via Neon)
app/api/portfolio-serve/[subdomain]/[...path]/route.ts — Serves portfolio files from Blob with injections
scripts/generate-portfolio.ts      — CLI script for manual generation
drizzle.config.ts                  — Drizzle config
```

Key facts:
- Uses `@anthropic-ai/sdk` (direct API, not Claude Code SDK)
- Model: `claude-sonnet-4-5`
- Generates 3 files: `index.html`, `styles.css`, `script.js`
- Uses an agentic tool-use loop (up to 30 turns)
- Files are uploaded to Vercel Blob at `portfolios/{subdomain}/`
- The `users` table has: bio, instagramHandles, tiktokHandles, youtubeHandles, twitterHandles, niches, tagline
- The `media` table has user uploads with `url`, `type`, `thumbnailUrl`, `metadata` (width, height, caption)
- The `posts` table tracks external social media posts with `platform`, `postUrl`, `metadata` (likes, views)
- DB migrations use Drizzle Kit: `pnpm db:generate` then `pnpm db:migrate`

---

## Implementation Order

Implement these 7 features in order. Each builds on the previous. Do NOT skip ahead.

---

### Feature 1: Enable Extended Thinking

**Goal:** Enable Claude's extended thinking so it plans the design holistically before writing code.

**File:** `lib/agent/portfolio-generator.ts`

**Changes:**
1. In the `client.messages.create()` call, add the `thinking` parameter:
   ```ts
   thinking: { type: "enabled", budget_tokens: 10000 }
   ```
2. Increase `max_tokens` from `16384` to `32000` to accommodate thinking + output
3. In the response processing loop, handle `thinking` blocks — they appear in `response.content` with `type: "thinking"`. Log the thinking summary but don't treat them as tool calls. Filter them when checking for tool uses.
4. Track thinking tokens in the usage object. The response `usage` includes `cache_creation_input_tokens` and `cache_read_input_tokens` when thinking is enabled — just log these, don't break on them.

**Verify:** The agentic loop still works. Thinking blocks don't cause errors. Tool use extraction still works (it filters by `type === "tool_use"` which should already skip thinking blocks).

---

### Feature 2: Curated Google Fonts Registry

**Goal:** Provide a validated font list so Claude never hallucinates font names or falls back to overused defaults.

**Create:** `lib/agent/font-registry.ts`

**Contents:**
- Define a `Font` type: `{ name: string; googleImportUrl: string; category: 'display' | 'serif' | 'sans-serif' | 'mono' | 'handwritten'; moods: string[]; weights: number[] }`
- Define a `FontPairing` type: `{ display: string; body: string; description: string }`
- Export `FONT_REGISTRY: Font[]` with 80-100 curated fonts. Every Google Fonts import URL must be correct (format: `https://fonts.googleapis.com/css2?family=Font+Name:wght@400;700&display=swap`). Include fonts like:
  - Display: Playfair Display, Cormorant Garamond, Archivo Black, Bebas Neue, Abril Fatface, Righteous, Yeseva One, Cinzel, Josefin Sans, Syne, Instrument Serif, Fraunces, Gambetta, Literata, Young Serif
  - Sans: DM Sans, Outfit, Plus Jakarta Sans, Lexend, Satoshi (note: not on Google Fonts — use alternatives), Geist (not on Google Fonts — skip), Figtree, Sora, General Sans (not on Google — skip), Switzer (not on Google — skip), Cabinet Grotesk (not on Google — skip), Manrope, Urbanist, Bricolage Grotesque
  - Serif body: Source Serif 4, Lora, Crimson Pro, Libre Baskerville, EB Garamond, Noto Serif, Bitter, Merriweather
  - Mono: JetBrains Mono, Fira Code, IBM Plex Mono, Space Mono, Red Hat Mono, Martian Mono
  - Character: Caveat, Pacifico, Press Start 2P, Silkscreen, VT323, Sacramento, Indie Flower
- Export `FONT_PAIRINGS: FontPairing[]` with 25-30 curated pairings
- Export `BANNED_FONTS: string[]` = `['Inter', 'Roboto', 'Arial', 'Open Sans', 'Lato', 'Montserrat', 'Space Grotesk', 'Poppins', 'Nunito', 'Raleway', 'Helvetica', 'system-ui']`
- Export `getRecommendedFonts(moods: string[]): Font[]` — returns fonts matching any of the given moods
- Export `getRandomPairing(): FontPairing` — returns a random pairing

Only include fonts that are actually on Google Fonts with correct import URLs. Double-check every URL format.

---

### Feature 3: Design Seed System

**Goal:** Randomly select a curated aesthetic direction for each generation to guarantee diversity.

**Create:** `lib/agent/design-seeds.ts`

**Contents:**
- Define a `DesignSeed` type:
  ```ts
  {
    id: string;              // e.g., "warm-editorial", "neon-brutalist"
    name: string;            // Human-readable name
    fontPairing: FontPairing; // From font-registry
    colorPalette: {
      primary: string;       // hex
      secondary: string;
      accent: string;
      background: string;
      text: string;
      muted: string;
    };
    layoutArchetype: string; // e.g., "editorial magazine", "bento grid"
    moodKeywords: string[];  // e.g., ["brutalist", "raw", "industrial"]
    theme: 'light' | 'dark' | 'mixed';
    cssInspiration: string;  // 1-2 sentence description of the visual feel
  }
  ```
- Export `DESIGN_SEEDS: DesignSeed[]` with 30+ seeds. Use font pairings from the font registry. Create diverse seeds covering:
  - Warm editorial, neon brutalist, soft luxury, retro pop, nature organic, tech dark, art deco, pastel dreamy, swiss modern, cyberpunk, japanese minimal, memphis design, noir cinematic, coastal calm, industrial warehouse, baroque maximalist, scandinavian clean, vaporwave, terracotta earth, midnight jewel, paper & ink, bauhaus, tropical bold, monochrome elegant, grunge texture, glass morphism, clay soft, copper & sage, ink & gold, arctic frost
- Export `selectDesignSeed(excludeIds?: string[]): DesignSeed` — picks random seed, optionally excluding recent ones
- Export `formatSeedForPrompt(seed: DesignSeed): string` — formats the seed as a markdown section for the prompt with concrete directives (not suggestions)

**Modify:** `lib/agent/portfolio-prompt.ts`
- Add `designSeed?: DesignSeed` to `QuestionnaireData`
- In `buildPortfolioPrompt()`, if a design seed is provided, add a `## Design Direction (MANDATORY)` section that includes:
  - The exact fonts to use with their Google Fonts import URLs
  - The exact color palette with hex values and CSS custom property names
  - The layout archetype to follow
  - The mood/aesthetic to embody
  - Make it clear these are requirements, not suggestions

**Modify:** `lib/agent/portfolio-generator.ts`
- Import `selectDesignSeed` and `DesignSeed`
- Before building the prompt, call `selectDesignSeed()` to get a seed
- Pass the seed through to `buildPortfolioPrompt()`
- Log which seed was selected
- Return the seed ID in the `GenerationResult`

**Modify:** `lib/inngest/functions/generate-portfolio.ts`
- After generation, save the `designSeedId` to the `portfolioGenerations` record

**Schema change:** `lib/db/schema.ts`
- Add to `portfolioGenerations`:
  - `designSeedId: text("design_seed_id")`
  - `qualityScore: integer("quality_score")`
  - `fontsUsed: text("fonts_used").array()`
  - `primaryColors: text("primary_colors").array()`

Run `pnpm db:generate` to create the migration, but do NOT run `pnpm db:migrate` (I'll do that manually).

---

### Feature 4: Inject Real Creator Content

**Goal:** Use the creator's actual bio, social links, and uploaded media so portfolios contain real content.

**Modify:** `lib/agent/portfolio-prompt.ts`
- Expand `QuestionnaireData` with:
  ```ts
  bio?: string | null;
  tagline?: string | null;
  niches?: string[] | null;
  socialLinks?: { platform: string; handle: string; url: string }[];
  mediaItems?: { url: string; thumbnailUrl?: string; type: string; caption?: string; width?: number; height?: number }[];
  ```
- In `buildPortfolioPrompt()`, add these sections ONLY if the data is available:
  - `## Creator Profile` — bio, tagline, niches. Tell Claude to use this as the About section content verbatim (don't invent a new bio).
  - `## Social Links` — list each platform handle with full URL. Tell Claude to link these in the nav/footer/hero.
  - `## Portfolio Media` — list each media item with its Vercel Blob URL, type, dimensions, caption. Tell Claude to use these real URLs in `<img>`/`<video>` tags in the portfolio section. Emphasize: do NOT use placeholder images, use these real URLs.

**Modify:** `lib/inngest/functions/generate-portfolio.ts`
- In the "load-data" step, additionally query:
  - `users` table: `bio`, `tagline`, `niches`, `instagramHandles`, `tiktokHandles`, `youtubeHandles`, `twitterHandles`
  - `media` table: select all media for the user, ordered by `createdAt` desc, limit 20
- Build the `socialLinks` array from the handles (e.g., `{ platform: 'instagram', handle: '@johndoe', url: 'https://instagram.com/johndoe' }`)
- Build the `mediaItems` array from the media query results
- Pass all of this into `QuestionnaireData`

**Modify:** `scripts/generate-portfolio.ts`
- Similarly load the expanded data when running the CLI script

---

### Feature 5: Creator Archetype Detection

**Goal:** Auto-detect the creator's niche and select a tailored system prompt variant.

**Create:** `lib/agent/archetype-detector.ts`

**Contents:**
- Define archetypes:
  ```ts
  type CreatorArchetype = 'fashion-beauty' | 'lifestyle-food' | 'tech-gaming' | 'family-kids' | 'fitness-wellness' | 'general';
  ```
- Export `detectArchetype(data: { portfolioVision: string; inspiringBrands?: string | null; niches?: string[] | null }): CreatorArchetype`
  - Keyword matching against portfolioVision and inspiringBrands:
    - fashion-beauty: skincare, makeup, beauty, fashion, style, outfit, aesthetic, glam, cosmetics, hair, nails
    - lifestyle-food: recipe, cooking, food, lifestyle, home, decor, travel, wellness, vlog, daily
    - tech-gaming: tech, gaming, game, software, app, gadget, review, unboxing, PC, console
    - family-kids: family, kids, children, parenting, mom, dad, baby, toddler, toys
    - fitness-wellness: fitness, workout, gym, health, nutrition, yoga, training, muscle, diet, wellness
    - general: fallback
  - Also check niches array if provided
  - Return the archetype with the most keyword matches, or 'general' if no clear winner

**Create:** `lib/agent/system-prompts.ts`

**Contents:**
- Export `getSystemPrompt(archetype: CreatorArchetype): string`
- The base prompt stays mostly the same (keep all technical requirements, file constraints, contact form requirements, tool descriptions)
- But customize these sections per archetype:
  - **Design Thinking > Tone**: Tailor the aesthetic guidance
  - **Frontend Aesthetics Guidelines**: Adjust emphasis
  - Add an `## Archetype-Specific Guidance` section at the end

Example customizations:
- **fashion-beauty**: "Lean toward editorial, magazine-style layouts. High-contrast photography focus. Think Vogue, Harper's Bazaar. Generous white space, elegant serif headlines, muted luxury palettes. The portfolio grid should feel like a lookbook."
- **lifestyle-food**: "Warm, inviting, organic feel. Earth tones, natural textures, photo-forward design. Think a beautiful food blog or travel journal. Rounded corners, warm shadows, handwritten accents are welcome."
- **tech-gaming**: "Bold, dark-mode-first, tech-forward. Think product launch pages. Monospace accents, animated counters, grid-heavy layouts. Neon accents on dark backgrounds. Sharp edges, no rounded corners."
- **family-kids**: "Playful, bright, approachable. Rounded shapes, fun animations, vibrant but not overwhelming colors. Think Highlights magazine meets modern web. Friendly typography, bouncy micro-interactions."
- **fitness-wellness**: "Clean, energetic, action-oriented. Strong typography, dynamic diagonal lines, high-contrast CTAs. Think Nike or Peloton. Progress-bar motifs, bold section breaks, motivational tone."
- **general**: Current prompt as-is.

**Modify:** `lib/agent/portfolio-generator.ts`
- Import `detectArchetype` and `getSystemPrompt`
- Before the API call, detect the archetype from the questionnaire data
- Use `getSystemPrompt(archetype)` instead of the hardcoded `SYSTEM_PROMPT` constant
- Remove the `SYSTEM_PROMPT` constant from this file (it moves to `system-prompts.ts`)
- Log which archetype was detected

**Modify:** `lib/agent/portfolio-prompt.ts`
- Add `archetype?: string` to `QuestionnaireData` (for logging/tracking, not used in prompt building since it goes into the system prompt)

---

### Feature 6: Generation History & Avoidance

**Goal:** Track what was used in recent generations and tell Claude to avoid those choices.

**Create:** `lib/agent/generation-history.ts`

**Contents:**
- Export `getRecentDesignChoices(limit?: number): Promise<{ seedIds: string[]; fonts: string[]; colors: string[] }>`
  - Query `portfolioGenerations` table for the last `limit` (default 10) completed generations
  - Collect unique `designSeedId`, `fontsUsed`, `primaryColors` values
  - Return them as sets
- Export `buildAvoidancePrompt(recent: { seedIds: string[]; fonts: string[]; colors: string[] }): string`
  - Returns a markdown section like:
    ```
    ## Avoid These Recent Choices
    These fonts were used in recent portfolios — do NOT use them: [list]
    These color schemes were used recently — choose something distinctly different: [list]
    ```
  - If no recent data, return empty string

**Create:** `lib/agent/css-parser.ts`

**Contents:**
- Export `extractDesignMetadata(files: GeneratedFile[]): { fonts: string[]; colors: string[] }`
  - Parse the HTML and CSS files to extract:
    - Google Fonts from `@import` URLs or `<link>` tags (extract font family names)
    - CSS custom property values that look like colors (hex, rgb, hsl)
  - Use simple regex — no need for a full CSS parser
  - Return deduplicated arrays

**Modify:** `lib/agent/portfolio-generator.ts`
- After generation succeeds, call `extractDesignMetadata(files)` to get fonts and colors
- Return these in the `GenerationResult` alongside the files

**Modify:** `lib/agent/portfolio-prompt.ts`
- Add `avoidancePrompt?: string` to `QuestionnaireData`
- If provided, append it to the prompt

**Modify:** `lib/inngest/functions/generate-portfolio.ts`
- Before generation, call `getRecentDesignChoices()` and `buildAvoidancePrompt()`
- Pass the avoidance prompt into the questionnaire data
- After generation, save `fontsUsed` and `primaryColors` from the result to the `portfolioGenerations` record
- Pass recent seed IDs to `selectDesignSeed(excludeIds)` so it avoids repeats

**Modify:** `lib/agent/design-seeds.ts`
- Update `selectDesignSeed` to accept and use `excludeIds`

---

### Feature 7: Post-Generation Quality Validation

**Goal:** Review generated output and auto-regenerate if quality is too low.

**Create:** `lib/agent/portfolio-reviewer.ts`

**Contents:**
- Export `reviewPortfolio(files: GeneratedFile[], creatorContext: { name: string; archetype: string; designSeed: DesignSeed }): Promise<ReviewResult>`
- `ReviewResult` type:
  ```ts
  {
    passed: boolean;
    overallScore: number;        // 1-10
    scores: {
      distinctiveness: number;   // 1-10
      codeQuality: number;       // 1-10
      brandAlignment: number;    // 1-10
      responsiveness: number;    // 1-10
      accessibility: number;     // 1-10
    };
    critique: string;            // Specific feedback for improvement
    issues: string[];            // List of specific issues found
  }
  ```
- Implementation:
  - Concatenate the HTML, CSS, and JS files into a single review payload
  - Call Claude API (use `claude-sonnet-4-5`, no extended thinking needed, `max_tokens: 4096`)
  - System prompt should instruct Claude to review as a senior frontend designer and return JSON
  - Check for: banned fonts, placeholder text ("Lorem ipsum", "Project 1", "Description here"), missing sections, missing contact form fields, missing viewport meta, generic color schemes
  - `passed` = true if `overallScore >= 7`
- Export `QUALITY_THRESHOLD = 7`

**Modify:** `lib/inngest/functions/generate-portfolio.ts`
- Add a new step between "generate-with-claude" and "upload-and-activate":
  ```
  step.run("review-quality", async () => { ... })
  ```
- If review fails (`!passed`), run a second generation attempt:
  - Add the review's `critique` as a `## Reviewer Feedback (MUST ADDRESS)` section in the prompt
  - Use the same design seed (don't re-randomize)
  - Only retry once (don't loop)
- If the retry also fails, proceed anyway but log a warning and save the low score
- Save `qualityScore` to the `portfolioGenerations` record regardless

**Modify:** `lib/agent/portfolio-generator.ts`
- Accept an optional `reviewerFeedback?: string` parameter in `generatePortfolio()`
- If provided, append it to the user prompt
- Export `GenerationResult` with optional `designMetadata: { fonts: string[]; colors: string[] }`

---

## Important Notes

1. **Do NOT run `pnpm db:migrate`** — just generate the migration file with `pnpm db:generate`. I will review and run it manually.

2. **Keep backward compatibility** — the `scripts/generate-portfolio.ts` CLI should still work. All new fields on `QuestionnaireData` should be optional.

3. **Don't touch** `lib/portfolio/storage.ts`, `lib/portfolio/platform-injections.ts`, or `app/api/portfolio-serve/`. The serving layer is fine as-is.

4. **Don't touch** the favicon generation — it's independent and working.

5. **Import paths** use `@/` alias (e.g., `import { db } from "@/lib/db"`).

6. **Error handling** — all new code should fail gracefully. If font registry is empty, if design seed selection fails, if archetype detection returns no match, if quality review API call fails — the generation should still complete. Never let an enhancement break the core flow.

7. **Logging** — add `console.log` statements for key decisions: which seed was selected, which archetype was detected, quality review scores, which fonts/colors were extracted, whether a retry was triggered.

8. **Tests** — no test files exist in this project. Don't create any.

9. **Type safety** — use proper TypeScript types throughout. No `any` types.

10. After all features are implemented, update `lib/agent/portfolio-generator.ts` to remove the old inline `SYSTEM_PROMPT` constant (it should come from `system-prompts.ts`). Make sure the old `tools` array definition stays in `portfolio-generator.ts` (it's part of the API call, not the prompt).

## File Summary

### New files to create:
- `lib/agent/font-registry.ts`
- `lib/agent/design-seeds.ts`
- `lib/agent/archetype-detector.ts`
- `lib/agent/system-prompts.ts`
- `lib/agent/generation-history.ts`
- `lib/agent/css-parser.ts`
- `lib/agent/portfolio-reviewer.ts`

### Files to modify:
- `lib/agent/portfolio-generator.ts` (extended thinking, design seeds, archetype prompt selection, reviewer feedback, metadata extraction)
- `lib/agent/portfolio-prompt.ts` (expanded QuestionnaireData, design seed section, real content sections, avoidance section)
- `lib/inngest/functions/generate-portfolio.ts` (load expanded data, select seed, detect archetype, get avoidance, quality review step, retry logic, save metadata)
- `lib/db/schema.ts` (add columns to portfolioGenerations)
- `scripts/generate-portfolio.ts` (load expanded data)

### Migration:
- Run `pnpm db:generate` at the end to create the migration file for the schema changes.
