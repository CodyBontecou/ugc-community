// =====================================================
// Types
// =====================================================

export interface QuestionnaireData {
  portfolioVision: string;
  inspiringBrands: string | null;
  portfolioExamples: string | null;
  creatorName: string;
  subdomain: string;
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

  // Simple instructions
  sections.push(`## Steps

1. Optionally fetch 1-2 reference URLs (skip if no URLs provided)
2. Create index.html with all sections
3. Create styles.css with complete styling
4. Create script.js for interactivity

Start creating files now.`);

  return sections.join("\n\n");
}
