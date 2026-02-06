{
  "id": "db1e4bc0",
  "title": "Creator archetype-based system prompt variants",
  "tags": [
    "portfolio-generation",
    "priority-medium",
    "design"
  ],
  "status": "open",
  "created_at": "2026-02-06T23:40:49.597Z"
}

## Overview
Replace the single monolithic system prompt with archetype-specific variants that are optimized for different types of UGC creators.

## Tasks
- Define 5-6 creator archetypes based on common UGC niches:
  1. **Fashion/Beauty** → editorial, magazine-style, high-contrast photography focus
  2. **Lifestyle/Food** → warm, organic, photo-forward with natural textures
  3. **Tech/Gaming** → bold, dark mode, animated, grid-heavy
  4. **Family/Kids** → playful, bright colors, rounded shapes, approachable
  5. **Fitness/Wellness** → clean, energetic, strong typography, action-oriented
  6. **General/Mixed** → the current default prompt (fallback)
- Create `lib/agent/system-prompts.ts` with a prompt per archetype
  - Each variant keeps the core technical requirements (3 files, contact form, etc.)
  - But customizes: tone, aesthetic direction, layout suggestions, example descriptions, color guidance
- Add archetype detection: analyze `portfolioVision` and `inspiringBrands` keywords to auto-classify
  - e.g., mentions of "skincare", "fashion", "beauty" → Fashion/Beauty archetype
  - e.g., mentions of "recipe", "cooking", "lifestyle" → Lifestyle/Food
- Allow admin override: add an optional `archetype` field to generation request
- Optionally add archetype selection to onboarding questionnaire

## Files
- `lib/agent/system-prompts.ts` (new)
- `lib/agent/archetype-detector.ts` (new)
- `lib/agent/portfolio-generator.ts` (modify — select prompt variant)
- `lib/agent/portfolio-prompt.ts` (modify — pass archetype context)

## Acceptance Criteria
- At least 5 distinct system prompt variants exist
- Archetype is auto-detected from questionnaire data
- Each archetype produces visually distinct output styles
- Fallback to general prompt if archetype is unclear
- Archetype is logged/persisted for analytics
