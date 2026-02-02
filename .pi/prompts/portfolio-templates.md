# Portfolio Templates Epic

## Context

You're working on `ugc-community`, a platform for UGC creators. We're implementing a template-based portfolio system that lets creators build their own portfolio websites by selecting pre-made themes, customizing colors/fonts, and filling in content via forms.

**Branch:** `cb/portfolio-templates`
**Neon DB Branch:** `portfolio-templates`
**Epic:** `ugc-community-5566`

## What's Already Done

1. **Database schema** - `templates` and `portfolio_configs` tables created
2. **Seed data** - 3 templates seeded: Minimal, Bold, Elegant
3. **Removed** - AI generation system (questionnaires, Inngest functions, GitHub deployment)
4. **Design doc** - `docs/PORTFOLIO_TEMPLATES.md`
5. **Tickets** - Full breakdown in beads (`bd children ugc-community-5566`)

## Architecture Overview

```
Creator selects Template → Customizes Theme → Arranges Sections → Fills Content
                                    ↓
                    Renders at {subdomain}.ugc.community
```

**Data flow:**
- `templates` table stores available themes with defaults
- `portfolio_configs` stores user's template choice, section order, theme overrides, content
- `portfolioProjects` table (existing) provides content for Work section
- Rendering happens server-side in Next.js at `/creators/[subdomain]`

## Key Files

```
lib/db/schema.ts          # templates, portfolioConfigs tables + types
docs/PORTFOLIO_TEMPLATES.md   # Full design doc with section specs

# To be created:
lib/templates/
├── registry.ts           # Map slugs → components
├── types.ts              # Section/theme TypeScript types
├── sections/             # Reusable section components
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── Work.tsx
│   ├── Contact.tsx
│   ├── Services.tsx
│   ├── Testimonials.tsx
│   └── Stats.tsx
└── themes/
    └── minimal/
        └── index.tsx

app/(public)/creators/[subdomain]/page.tsx  # Update to render templates
```

## Type Reference

From `lib/db/schema.ts`:

```typescript
type PortfolioSections = {
  order?: string[];
  hero?: { visible?: boolean; variant?: string; content?: SectionContent };
  about?: { visible?: boolean; variant?: string; content?: SectionContent };
  // ... etc
};

type ThemeConfig = {
  colors?: { primary, secondary, accent, background, surface, text, border };
  typography?: { headingFont, bodyFont, baseSize, scale };
  spacing?: { sectionGap, contentWidth };
  effects?: { borderRadius, shadows, animations };
};
```

## Section Variants

| Section | Variants |
|---------|----------|
| Hero | centered, split-left, split-right, video-bg, minimal |
| About | default, centered, with-stats, timeline |
| Work | grid, masonry, carousel, featured, list |
| Services | cards, list, pricing, icons |
| Testimonials | carousel, grid, featured, marquee |
| Stats | inline, cards, large, animated |
| Contact | simple, form, split, cta |

## Commands

```bash
# Check tickets
bd show ugc-community-5566
bd children ugc-community-5566
bd ready

# Claim a ticket
bd update <id> --status in_progress

# Run dev server
npm run dev

# Check DB
psql "$DATABASE_URL" -c "SELECT * FROM templates;"
```

## Starting Point

Begin with ticket `ugc-community-5566.1` (template registry and types), then:

1. **Create `lib/templates/types.ts`** - Export interfaces matching schema.ts types
2. **Create `lib/templates/registry.ts`** - Template lookup by slug
3. **Create `lib/templates/sections/Hero.tsx`** - First section component
4. **Create `lib/templates/themes/minimal/index.tsx`** - Compose sections
5. **Update `app/(public)/creators/[subdomain]/page.tsx`** - Render from config

## Design Principles

- **Form-based editing** - No drag-and-drop page builders, simple forms per section
- **Theme as CSS variables** - Apply colors/fonts via `--color-primary` etc.
- **Server-rendered** - No client-side template rendering
- **Progressive enhancement** - Start with Minimal, add Bold/Elegant later
- **Reuse existing data** - Work section pulls from `portfolioProjects` table

## Testing a Portfolio

1. Create a portfolio config for a test user:
```sql
INSERT INTO portfolio_configs (user_id, template_id, sections, theme, is_published)
SELECT 
  u.id,
  t.id,
  '{"order": ["hero", "about", "contact"]}',
  '{}',
  true
FROM users u, templates t
WHERE u.subdomain = 'testuser' AND t.slug = 'minimal';
```

2. Visit `http://localhost:3000/creators/testuser`

## Questions to Clarify

- Should unpublished portfolios show a 404 or a "coming soon" page?
- For the Work section, show all projects or require explicit selection?
- Include a "Custom HTML" section for power users?
