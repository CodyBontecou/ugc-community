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

  // Introduction
  sections.push(`Generate a complete, production-ready portfolio website for **${data.creatorName}**.`);

  // Creator's Vision
  sections.push(`## Creator's Vision

${data.portfolioVision}`);

  // Research Workflow - always include if there's inspiration to research
  if (data.inspiringBrands || data.portfolioExamples) {
    sections.push(`## Research Workflow

Before generating any code, research the creator's inspirations:

1. **Brand Research** (if inspiring brands provided)
   - Use WebSearch to find each brand's official website
   - Use WebFetch to analyze their visual identity, color palette, typography
   - Note design patterns that align with the creator's vision

2. **Portfolio Analysis** (if portfolio examples provided)
   - Use WebFetch to view each portfolio URL
   - Analyze layout structure, interactions, color usage
   - Identify techniques worth incorporating

3. **Synthesize Findings**
   - Combine research into a cohesive design direction
   - Only then begin generating files`);
  }

  // Research and Inspiration
  if (data.inspiringBrands || data.portfolioExamples) {
    const inspirationParts: string[] = [];

    if (data.inspiringBrands) {
      inspirationParts.push(`**Inspiring Brands:** ${data.inspiringBrands}

Use WebSearch to find these brands' websites, then WebFetch to analyze:
- Primary and accent colors
- Typography choices (font families, weights, sizes)
- Layout patterns and whitespace usage
- Interactive elements and hover states
- Overall aesthetic and mood`);
    }

    if (data.portfolioExamples) {
      inspirationParts.push(`**Portfolio References:** ${data.portfolioExamples}

Use WebFetch to analyze each portfolio:
- Section structure and navigation
- How work is showcased (grids, sliders, case studies)
- Animation and transition techniques
- Mobile responsiveness approach`);
    }

    sections.push(`## Design Inspiration

${inspirationParts.join("\n\n")}`);
  }

  // Technical Requirements
  sections.push(`## Technical Requirements

- **HTML:** Semantic HTML5 markup
- **CSS:** Modern CSS (Flexbox, Grid, custom properties, animations)
- **JavaScript:** Vanilla JavaScript (ES6+) - no frameworks or libraries
- **Responsive:** Mobile-first design
- **Performance:** Optimized for fast loading`);

  // Required Files
  sections.push(`## Required Files

Generate the following files using the Write tool:

### Core Files
- \`index.html\` - Main HTML page with all sections (Hero, Portfolio, About, Contact)
- \`styles.css\` - All CSS styles including layout, typography, colors, animations, and responsive design
- \`script.js\` - JavaScript for interactions, smooth scrolling, and dynamic effects

### Documentation
- \`README.md\` - Project documentation`);

  // Design Guidelines
  sections.push(`## Design Guidelines

1. **Distinctive Aesthetics**
   - Avoid generic template looks
   - Create a unique visual identity based on the creator's vision
   - Use creative typography pairings (Google Fonts via CDN)
   - Develop a cohesive color palette using CSS custom properties

2. **Animations & Interactions**
   - Smooth scroll behavior (CSS scroll-behavior or JS)
   - Subtle hover effects with CSS transitions
   - Page load animations using CSS animations
   - Micro-interactions on interactive elements

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Proper heading hierarchy
   - Sufficient color contrast
   - Keyboard navigation support
   - Descriptive alt text placeholders

4. **Performance**
   - No external JavaScript libraries or frameworks
   - Optimized for fast loading
   - Minimal JavaScript footprint`);

  // Deployment Context
  sections.push(`## Deployment

The site will be deployed to: **https://${data.subdomain}.ugc.community**

Ensure all internal links and metadata reflect this domain.`);

  // Final Instructions - reordered to emphasize research first
  sections.push(`## Instructions

1. **Research Phase** (use WebSearch and WebFetch)
   - Investigate inspiring brands and portfolio examples
   - Document color palettes, typography, and design patterns

2. **Design Phase**
   - Synthesize research into a unique visual direction
   - Plan the color scheme and typography

3. **Build Phase**
   - Create index.html with all sections using Write tool
   - Create styles.css with all styling using Write tool
   - Create script.js for interactions using Write tool

When finished, output a brief summary of what was created.`);

  return sections.join("\n\n");
}
