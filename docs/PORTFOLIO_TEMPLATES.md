# Portfolio Templates System

> Design document for the template-based portfolio builder

## Overview

Creators select a template (theme), customize colors/fonts, reorder sections, and fill in content via forms. Portfolios render server-side at `{subdomain}.ugc.community`.

---

## Templates (Themes)

### 1. Minimal
- **Vibe:** Clean, lots of whitespace, typography-focused
- **Best for:** Creators who want content to speak for itself
- **Characteristics:**
  - Thin fonts, generous spacing
  - Subtle hover effects
  - Black/white with accent pops
  - Grid-based work display

### 2. Bold
- **Vibe:** High contrast, large imagery, impactful
- **Best for:** Creators with strong visual content
- **Characteristics:**
  - Heavy fonts, dramatic headlines
  - Full-bleed images/videos
  - Dark mode default
  - Asymmetric layouts

### 3. Elegant
- **Vibe:** Sophisticated, refined, editorial
- **Best for:** Luxury/beauty/lifestyle creators
- **Characteristics:**
  - Serif headings, refined typography
  - Soft gradients, subtle shadows
  - Warm neutral palette
  - Smooth scroll animations

---

## Section Types & Variants

### Hero
| Variant | Description |
|---------|-------------|
| `centered` | Text centered, optional background media |
| `split-left` | Image left, text right |
| `split-right` | Text left, image right |
| `video-bg` | Looping video background with overlay |
| `minimal` | Just text, no media, maximum whitespace |

**Content fields:**
- `headline` (string)
- `subheadline` (string)
- `backgroundMediaId` (uuid, optional)
- `ctaText` (string, optional)
- `ctaLink` (string, optional)
- `showScrollIndicator` (boolean)

---

### About
| Variant | Description |
|---------|-------------|
| `default` | Photo + bio side by side |
| `centered` | Photo above, bio below, centered |
| `with-stats` | Includes stat cards (years exp, brands, etc.) |
| `timeline` | Career timeline format |

**Content fields:**
- `title` (string, default: "About Me")
- `bio` (string, rich text)
- `profileMediaId` (uuid, optional)
- `stats` (array: { label, value })

---

### Work / Portfolio
| Variant | Description |
|---------|-------------|
| `grid` | Equal-size grid cards |
| `masonry` | Pinterest-style varied heights |
| `carousel` | Horizontal scroll/swipe |
| `featured` | One large + smaller grid |
| `list` | Vertical list with details |

**Content fields:**
- `title` (string, default: "My Work")
- `subtitle` (string, optional)
- `showFilters` (boolean) - filter by content type/platform
- `maxItems` (number, optional)
- `projectIds` (array, optional) - specific projects or all

*Note: Pulls from `portfolioProjects` table*

---

### Services
| Variant | Description |
|---------|-------------|
| `cards` | Card grid with icons |
| `list` | Simple list with descriptions |
| `pricing` | Cards with price points |
| `icons` | Icon-focused minimal list |

**Content fields:**
- `title` (string, default: "Services")
- `subtitle` (string, optional)
- `services` (array: { title, description, icon?, price? })

---

### Testimonials
| Variant | Description |
|---------|-------------|
| `carousel` | One at a time, auto-rotate |
| `grid` | 2-3 column card grid |
| `featured` | Single large quote |
| `marquee` | Continuous horizontal scroll |

**Content fields:**
- `title` (string, default: "What Brands Say")
- `testimonials` (array: { quote, name, company, avatarMediaId? })

---

### Stats
| Variant | Description |
|---------|-------------|
| `inline` | Horizontal row of numbers |
| `cards` | Individual stat cards |
| `large` | Big numbers, minimal labels |
| `animated` | Count-up animation on scroll |

**Content fields:**
- `stats` (array: { value, label, prefix?, suffix? })
- `showBackground` (boolean)

---

### Contact
| Variant | Description |
|---------|-------------|
| `simple` | Email + social links only |
| `form` | Contact form (uses existing system) |
| `split` | Form on one side, info on other |
| `cta` | Large CTA button + minimal info |

**Content fields:**
- `title` (string, default: "Let's Work Together")
- `subtitle` (string, optional)
- `showForm` (boolean)
- `email` (string, optional - uses user's email if blank)
- `showSocials` (boolean)

---

### Custom Block
| Variant | Description |
|---------|-------------|
| `text` | Rich text content |
| `media` | Full-width image or video |
| `embed` | YouTube/TikTok/Instagram embed |
| `html` | Raw HTML (admin-approved only?) |

**Content fields:**
- `content` (string, rich text)
- `mediaId` (uuid, optional)
- `embedUrl` (string, optional)

---

## Theme Customization

```typescript
interface ThemeConfig {
  colors: {
    primary: string;      // Main brand color
    secondary: string;    // Supporting color
    accent: string;       // Highlights, CTAs
    background: string;   // Page background
    surface: string;      // Card/section backgrounds
    text: {
      primary: string;    // Main text
      secondary: string;  // Muted text
      inverse: string;    // Text on dark backgrounds
    };
    border: string;       // Borders, dividers
  };
  
  typography: {
    headingFont: string;  // e.g., "Inter", "Playfair Display"
    bodyFont: string;     // e.g., "Inter", "Source Sans Pro"
    baseSize: number;     // 14-18px
    scale: number;        // 1.2 - 1.5 (heading size multiplier)
  };
  
  spacing: {
    sectionGap: 'compact' | 'normal' | 'spacious';
    contentWidth: 'narrow' | 'normal' | 'wide' | 'full';
  };
  
  effects: {
    borderRadius: 'none' | 'subtle' | 'rounded' | 'pill';
    shadows: 'none' | 'subtle' | 'medium' | 'dramatic';
    animations: boolean;
  };
}
```

### Font Options (Google Fonts)
**Headings:** Inter, Playfair Display, Montserrat, Poppins, Cormorant Garamond, Space Grotesk, DM Serif Display
**Body:** Inter, Source Sans Pro, Lato, Open Sans, Nunito, Work Sans

---

## Database Schema

### `templates` table
```sql
- id (uuid, PK)
- slug (text, unique) -- 'minimal', 'bold', 'elegant'
- name (text)
- description (text)
- preview_image_url (text)
- section_defaults (jsonb) -- default section order + content
- theme_defaults (jsonb) -- default theme config
- available_sections (text[]) -- which sections this template supports
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### `portfolio_configs` table
```sql
- id (uuid, PK)
- user_id (text, FK -> users, unique)
- template_id (uuid, FK -> templates)
- sections (jsonb) -- section order, visibility, content
- theme (jsonb) -- color/font overrides
- custom_css (text, nullable) -- advanced users/admin
- seo (jsonb) -- { title, description, ogImage }
- is_published (boolean)
- published_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## Rendering Flow

```
Request: GET /creators/{subdomain}
    │
    ▼
┌─────────────────────────────────┐
│ 1. Lookup user by subdomain     │
│ 2. Get portfolioConfig          │
│ 3. Get template component       │
│ 4. Fetch portfolioProjects      │
│ 5. Fetch media assets           │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ Render template with:           │
│ - User's section config         │
│ - Theme customizations          │
│ - Content (projects, media)     │
│ - CSS variables for theme       │
└─────────────────────────────────┘
    │
    ▼
Server-rendered HTML
```

---

## Editor UI (Dashboard)

### Template Selection
- Visual grid of template previews
- Live preview with user's content
- "Use this template" button

### Section Manager
- Drag-and-drop reorder
- Toggle visibility
- Click to edit content
- Variant selector dropdown

### Theme Editor
- Color pickers with presets
- Font dropdowns with preview
- Spacing/effect toggles
- Live preview panel

### Content Forms
- Per-section forms
- Media picker (from user's uploads)
- Rich text for bio/descriptions
- Array fields for services/testimonials

---

## Migration Notes

### Tables to Remove
- `onboarding_questionnaires`
- `portfolio_generations`

### Code to Remove
- `app/api/admin/questionnaires/` (entire directory)
- `app/api/user/portfolio-status/`
- `lib/inngest/functions/portfolio-*`
- GitHub/Vercel deployment code

### Tables to Keep
- `portfolio_projects` - becomes content source for Work section
- `portfolio_project_media` - links projects to media
- `media` - user uploads

---

## Implementation Phases

### Phase 1: Foundation
- [ ] DB schema migration
- [ ] Template registry + types
- [ ] Basic Minimal template
- [ ] Server-side rendering at /creators/[subdomain]

### Phase 2: Editor
- [ ] Template selection UI
- [ ] Section manager (reorder, visibility)
- [ ] Theme editor (colors, fonts)
- [ ] Content forms per section

### Phase 3: Polish
- [ ] Bold + Elegant templates
- [ ] Section variants
- [ ] Preview mode
- [ ] Publish flow

### Phase 4: Advanced
- [ ] Custom CSS (admin)
- [ ] SEO settings
- [ ] Analytics integration
- [ ] Template marketplace prep
