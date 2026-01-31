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

  // Research and Inspiration
  if (data.inspiringBrands || data.portfolioExamples) {
    const inspirationParts: string[] = [];

    if (data.inspiringBrands) {
      inspirationParts.push(`**Inspiring Brands:** ${data.inspiringBrands}

Research these brands' visual identities and incorporate relevant design patterns, color schemes, or aesthetic elements that align with the creator's vision.`);
    }

    if (data.portfolioExamples) {
      inspirationParts.push(`**Portfolio References:** ${data.portfolioExamples}

Use these as inspiration for layout, interactions, or presentation style.`);
    }

    sections.push(`## Design Inspiration

${inspirationParts.join("\n\n")}`);
  }

  // Technical Requirements
  sections.push(`## Technical Requirements

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Responsive:** Mobile-first design
- **Performance:** Optimized images, minimal JavaScript bundle`);

  // Required Files
  sections.push(`## Required Files

Generate the following files using the write_file tool:

### Core Application Files
- \`app/layout.tsx\` - Root layout with metadata, fonts, and global structure
- \`app/page.tsx\` - Homepage with all sections
- \`app/globals.css\` - Tailwind imports and custom CSS

### Components
- \`components/Hero.tsx\` - Hero/intro section with creator name and tagline
- \`components/Portfolio.tsx\` - Work showcase grid/gallery
- \`components/About.tsx\` - About/bio section
- \`components/Contact.tsx\` - Contact information and/or form

### Configuration
- \`tailwind.config.ts\` - Tailwind configuration with custom theme
- \`package.json\` - Dependencies (next, react, react-dom, tailwindcss, etc.)
- \`next.config.js\` - Next.js configuration
- \`tsconfig.json\` - TypeScript configuration
- \`postcss.config.mjs\` - PostCSS configuration for Tailwind

### Documentation
- \`README.md\` - Project documentation`);

  // Design Guidelines
  sections.push(`## Design Guidelines

1. **Distinctive Aesthetics**
   - Avoid generic template looks
   - Create a unique visual identity based on the creator's vision
   - Use creative typography pairings (Google Fonts)
   - Develop a cohesive color palette

2. **Animations & Interactions**
   - Smooth scroll behavior
   - Subtle hover effects
   - Page load animations (CSS-only where possible)
   - Micro-interactions on interactive elements

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Proper heading hierarchy
   - Sufficient color contrast
   - Keyboard navigation support
   - Descriptive alt text placeholders

4. **Performance**
   - No heavy JavaScript libraries
   - Optimized for Core Web Vitals
   - Lazy loading for images`);

  // Deployment Context
  sections.push(`## Deployment

The site will be deployed to: **https://${data.subdomain}.ugc.community**

Ensure all internal links and metadata reflect this domain.`);

  // Final Instructions
  sections.push(`## Instructions

1. Start by creating the configuration files (package.json, tailwind.config.ts, etc.)
2. Then create the component files
3. Finally create the app files (layout.tsx, page.tsx)
4. Call generation_complete when finished

Use the write_file tool for each file. Include complete, functional code in every file.`);

  return sections.join("\n\n");
}
