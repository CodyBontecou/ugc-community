// =====================================================
// Types
// =====================================================

import { DesignSeed, formatSeedForPrompt } from "./design-seeds";

export interface QuestionnaireData {
  portfolioVision: string;
  inspiringBrands: string | null;
  portfolioExamples: string | null;
  creatorName: string;
  subdomain: string;
  // Feature 3: Design Seed
  designSeed?: DesignSeed;
  // Feature 4: Real Creator Content
  bio?: string | null;
  tagline?: string | null;
  niches?: string[] | null;
  socialLinks?: { platform: string; handle: string; url: string }[];
  mediaItems?: {
    url: string;
    thumbnailUrl?: string;
    type: string;
    caption?: string;
    width?: number;
    height?: number;
  }[];
  // Feature 5: Archetype (for tracking)
  archetype?: string;
  // Feature 6: Avoidance
  avoidancePrompt?: string;
  // Feature 7: Reviewer feedback
  reviewerFeedback?: string;
}

// =====================================================
// Prompt Builder
// =====================================================

export function buildPortfolioPrompt(data: QuestionnaireData): string {
  const sections: string[] = [];

  // Introduction - emphasize efficiency
  sections.push(`Generate a portfolio website for **${data.creatorName}**.

**IMPORTANT: Be efficient.** Limit web requests to 1-2 maximum. Start creating files quickly.`);

  // Creator's Vision
  sections.push(`## Creator's Vision

${data.portfolioVision}`);

  // Only include inspiration if provided, and keep it brief
  if (data.inspiringBrands || data.portfolioExamples) {
    const parts: string[] = [];

    if (data.inspiringBrands) {
      parts.push(`**Brands for inspiration:** ${data.inspiringBrands}`);
    }

    if (data.portfolioExamples) {
      parts.push(`**Portfolio examples:** ${data.portfolioExamples}
(You may fetch 1-2 of these URLs for quick reference, but don't spend too much time researching)`);
    }

    sections.push(`## Inspiration (Optional Reference)

${parts.join("\n\n")}`);
  }

  // Combined requirements - keep concise
  sections.push(`## Requirements

**Files to create:**
1. \`index.html\` - Complete page (Hero, Portfolio, About, Contact sections)
2. \`styles.css\` - All styling with responsive breakpoints
3. \`script.js\` - Interactions and smooth scrolling

**Design:**
- Distinctive, non-generic look based on creator's vision
- Creative color palette using CSS custom properties
- Google Fonts for typography
- Smooth CSS animations and transitions
- Mobile-first responsive design
- WCAG 2.1 AA accessibility

**Technical:**
- Semantic HTML5
- Modern CSS (Flexbox, Grid)
- Vanilla JavaScript (ES6+) - no frameworks

**Deployment:** https://${data.subdomain}.ugc.community`);

  // Feature 3: Design Seed
  if (data.designSeed) {
    sections.push(formatSeedForPrompt(data.designSeed));
  }

  // Feature 4: Real Creator Content
  if (data.bio || data.tagline || (data.niches && data.niches.length > 0)) {
    const profileParts: string[] = [];
    if (data.tagline) {
      profileParts.push(`**Tagline:** ${data.tagline}`);
    }
    if (data.bio) {
      profileParts.push(
        `**Bio:** ${data.bio}\n(Use this as the About section content verbatim — do NOT invent a new bio.)`
      );
    }
    if (data.niches && data.niches.length > 0) {
      profileParts.push(`**Niches:** ${data.niches.join(", ")}`);
    }
    sections.push(`## Creator Profile\n\n${profileParts.join("\n\n")}`);
  }

  if (data.socialLinks && data.socialLinks.length > 0) {
    const linkLines = data.socialLinks.map(
      (link) => `- **${link.platform}**: ${link.handle} → ${link.url}`
    );
    sections.push(
      `## Social Links\n\nLink these in the navigation, hero, and/or footer:\n${linkLines.join("\n")}`
    );
  }

  if (data.mediaItems && data.mediaItems.length > 0) {
    const mediaLines = data.mediaItems.map((item, i) => {
      const dims =
        item.width && item.height ? ` (${item.width}×${item.height})` : "";
      const caption = item.caption ? ` — "${item.caption}"` : "";
      const thumb = item.thumbnailUrl
        ? `\n  Thumbnail: ${item.thumbnailUrl}`
        : "";
      return `${i + 1}. [${item.type}] ${item.url}${dims}${caption}${thumb}`;
    });
    sections.push(
      `## Portfolio Media\n\nUse these REAL URLs in <img>/<video> tags in the portfolio section. Do NOT use placeholder images.\n\n${mediaLines.join("\n")}`
    );
  }

  // Feature 6: Avoidance
  if (data.avoidancePrompt) {
    sections.push(data.avoidancePrompt);
  }

  // Feature 7: Reviewer feedback
  if (data.reviewerFeedback) {
    sections.push(data.reviewerFeedback);
  }

  // Simple instructions
  sections.push(`## Steps

1. Optionally fetch 1-2 reference URLs (skip if no URLs provided)
2. Create index.html with all sections
3. Create styles.css with complete styling
4. Create script.js for interactivity

Start creating files now.`);

  return sections.join("\n\n");
}
