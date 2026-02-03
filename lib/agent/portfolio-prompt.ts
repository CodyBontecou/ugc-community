import {
  generateStyleDirective,
  formatStyleDirectiveForPrompt,
  StyleDirective,
  UserStyleInput,
} from "./style-directives";

// =====================================================
// Types
// =====================================================

export interface SocialMediaHandle {
  platform: "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "other";
  handle: string;
}

export interface PortfolioProjectData {
  title: string;
  brandName?: string | null;
  campaignDescription?: string | null;
  contentType?: string | null;
  platforms?: string[] | null;
  results?: string | null;
  mediaUrls: string[]; // Vercel Blob URLs
  coverUrl?: string;
}

export interface QuestionnaireData {
  portfolioVision: string | null;
  inspiringBrands: string | null;
  portfolioExamples: string | null;
  socialMediaHandles?: SocialMediaHandle[];
  creatorName: string;
  creatorEmail?: string;
  subdomain: string;
  portfolioProjects?: PortfolioProjectData[];
  /** Optional pre-generated style directive. If not provided, one will be generated. */
  styleDirective?: StyleDirective;
}

// =====================================================
// Prompt Builder
// =====================================================

export function buildPortfolioPrompt(data: QuestionnaireData): string {
  const sections: string[] = [];

  // Build user style input from questionnaire data
  const userStyleInput: UserStyleInput = {
    portfolioVision: data.portfolioVision,
    inspiringBrands: data.inspiringBrands,
    portfolioExamples: data.portfolioExamples,
  };

  // Generate style directive informed by user input, or use provided one
  const styleDirective = data.styleDirective || generateStyleDirective(userStyleInput);

  // Introduction - emphasize efficiency
  sections.push(`Generate a portfolio website for **${data.creatorName}**.

**IMPORTANT: Be efficient.** Limit web requests to 1-2 maximum. Start creating files quickly.`);

  // Inject the style directive early - this is the key personalization
  // Pass user input so the prompt can reference that styles are tailored to their vision
  sections.push(formatStyleDirectiveForPrompt(styleDirective, userStyleInput));

  // Creator's Vision
  if (data.portfolioVision) {
    sections.push(`## Creator's Vision

${data.portfolioVision}`);
  }

  // Creator Contact & Social Media
  const contactParts: string[] = [];
  
  if (data.creatorEmail) {
    contactParts.push(`- **Email:** ${data.creatorEmail}`);
  }
  
  if (data.socialMediaHandles && data.socialMediaHandles.length > 0) {
    const socialLinks = data.socialMediaHandles
      .filter(h => h.handle.trim())
      .map(h => {
        const platformLabels: Record<string, string> = {
          instagram: "Instagram",
          tiktok: "TikTok",
          youtube: "YouTube",
          twitter: "X/Twitter",
          linkedin: "LinkedIn",
          other: "Other",
        };
        return `- **${platformLabels[h.platform] || h.platform}:** ${h.handle}`;
      });
    contactParts.push(...socialLinks);
  }
  
  if (contactParts.length > 0) {
    sections.push(`## Creator Contact & Social Links

**Include these in the portfolio's contact section and/or footer. Add clickable social media icons that link to these profiles:**

${contactParts.join("\n")}

**Social Link URLs:**
- Instagram: https://instagram.com/{handle} (remove @ if present)
- TikTok: https://tiktok.com/@{handle}
- YouTube: https://youtube.com/@{handle} or use full URL if provided
- X/Twitter: https://twitter.com/{handle} (remove @ if present)
- LinkedIn: use full URL if provided, otherwise https://linkedin.com/in/{handle}`);
  }

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

  // Portfolio Projects with real images
  if (data.portfolioProjects && data.portfolioProjects.length > 0) {
    const projectSections: string[] = [];

    data.portfolioProjects.forEach((project, index) => {
      const projectParts: string[] = [];
      projectParts.push(`### Project ${index + 1}: ${project.title}`);

      if (project.brandName) {
        projectParts.push(`- **Brand:** ${project.brandName}`);
      }
      if (project.contentType) {
        projectParts.push(`- **Type:** ${project.contentType}`);
      }
      if (project.platforms && project.platforms.length > 0) {
        projectParts.push(`- **Platforms:** ${project.platforms.join(", ")}`);
      }
      if (project.results) {
        projectParts.push(`- **Results:** ${project.results}`);
      }
      if (project.campaignDescription) {
        projectParts.push(`- **Description:** ${project.campaignDescription}`);
      }

      if (project.mediaUrls.length > 0) {
        projectParts.push(`- **Media:**`);
        project.mediaUrls.forEach((url, mediaIndex) => {
          const isCover = project.coverUrl === url ? " (Cover)" : "";
          projectParts.push(`  - Image ${mediaIndex + 1}${isCover}: ${url}`);
        });
      }

      projectSections.push(projectParts.join("\n"));
    });

    sections.push(`## Creator's Portfolio Work

The creator has uploaded the following projects. **Use these REAL images** in the portfolio section:

${projectSections.join("\n\n")}

**IMPORTANT:** Display these actual uploaded images in the portfolio. Use the provided URLs directly in \`<img>\` tags. Do not use placeholder images.`);
  }

  // Combined requirements - keep concise, reference style directive
  sections.push(`## Requirements

**Files to create:**
1. \`index.html\` - Complete page (Hero, Portfolio, About, Contact sections)
2. \`styles.css\` - All styling with responsive breakpoints (MUST use the CSS variables and fonts from Style Directive)
3. \`script.js\` - Interactions and animations (MUST implement the animation style from Style Directive)

**Design (follow Style Directive above):**
- Use the exact typography pairing specified
- Use the exact color palette and CSS variables specified
- Implement the layout archetype characteristics
- Apply the animation techniques listed
- Include the visual texture approaches
- Follow the theme mode principles
- Mobile-first responsive design
- WCAG 2.1 AA accessibility

**Technical:**
- Semantic HTML5
- Modern CSS (Flexbox, Grid)
- Vanilla JavaScript (ES6+) - no frameworks

**Footer:**
- Include copyright with current year: © ${new Date().getFullYear()} ${data.creatorName}

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
