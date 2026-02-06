// =====================================================
// Post-Generation Quality Validation
// =====================================================

import Anthropic from "@anthropic-ai/sdk";
import { GeneratedFile } from "./portfolio-generator";
import { DesignSeed } from "./design-seeds";

// =====================================================
// Types
// =====================================================

export interface ReviewScores {
  distinctiveness: number; // 1-10
  codeQuality: number; // 1-10
  brandAlignment: number; // 1-10
  responsiveness: number; // 1-10
  accessibility: number; // 1-10
}

export interface ReviewResult {
  passed: boolean;
  overallScore: number; // 1-10
  scores: ReviewScores;
  critique: string; // Specific feedback for improvement
  issues: string[]; // List of specific issues found
}

export const QUALITY_THRESHOLD = 7;

// =====================================================
// Review Prompt
// =====================================================

const REVIEW_SYSTEM_PROMPT = `You are a senior frontend designer and code reviewer. You will review a generated portfolio website and provide a quality assessment.

Return your assessment as a JSON object with this exact structure:
{
  "overallScore": <number 1-10>,
  "scores": {
    "distinctiveness": <number 1-10>,
    "codeQuality": <number 1-10>,
    "brandAlignment": <number 1-10>,
    "responsiveness": <number 1-10>,
    "accessibility": <number 1-10>
  },
  "critique": "<specific actionable feedback for improvement>",
  "issues": ["<issue 1>", "<issue 2>", ...]
}

Scoring guidelines:
- **Distinctiveness** (1-10): Is this visually unique and memorable? Does it avoid generic AI aesthetics? Penalize: Inter/Roboto/Arial fonts, generic purple-on-white schemes, cookie-cutter layouts.
- **Code Quality** (1-10): Is the HTML semantic? Is CSS well-organized with custom properties? Is JS clean and functional?
- **Brand Alignment** (1-10): Does it match the creator's archetype and the specified design direction? Does it use the specified fonts and colors?
- **Responsiveness** (1-10): Are there media queries? Does the layout adapt for mobile? Are font sizes, padding, and grid columns adjusted?
- **Accessibility** (1-10): Viewport meta tag present? Alt texts? Sufficient color contrast? Keyboard-navigable form? ARIA labels?

Check specifically for:
- Banned fonts used: Inter, Roboto, Arial, Open Sans, Lato, Montserrat, Space Grotesk, Poppins, Nunito, Raleway, Helvetica, system-ui
- Placeholder text: "Lorem ipsum", "Project 1", "Description here", "Your Name Here", "Jane Doe", placeholder.com URLs
- Missing required sections: Hero, Portfolio, About, Contact
- Missing contact form with id="contact-form" and required fields (name, email, company, message)
- Missing viewport meta tag
- Generic or bland color schemes

Return ONLY the JSON object, no other text.`;

// =====================================================
// Review Function
// =====================================================

export async function reviewPortfolio(
  files: GeneratedFile[],
  creatorContext: {
    name: string;
    archetype: string;
    designSeed: DesignSeed;
  }
): Promise<ReviewResult> {
  try {
    const client = new Anthropic();

    // Build the review payload
    const fileContents = files
      .filter((f) => !f.isBinary)
      .map((f) => `--- ${f.path} ---\n${f.content}`)
      .join("\n\n");

    const userPrompt = `Review this portfolio website generated for "${creatorContext.name}" (archetype: ${creatorContext.archetype}).

The design direction was: "${creatorContext.designSeed.name}" (${creatorContext.designSeed.id})
- Required fonts: ${creatorContext.designSeed.fontPairing.display} + ${creatorContext.designSeed.fontPairing.body}
- Required colors: primary ${creatorContext.designSeed.colorPalette.primary}, accent ${creatorContext.designSeed.colorPalette.accent}, background ${creatorContext.designSeed.colorPalette.background}
- Layout archetype: ${creatorContext.designSeed.layoutArchetype}
- Theme: ${creatorContext.designSeed.theme}

Generated files:

${fileContents}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract JSON from response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from reviewer");
    }

    // Try to parse JSON — handle cases where Claude wraps it in markdown code blocks
    let jsonStr = textBlock.text.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as {
      overallScore: number;
      scores: ReviewScores;
      critique: string;
      issues: string[];
    };

    const passed = parsed.overallScore >= QUALITY_THRESHOLD;

    console.log(`Quality review — overall: ${parsed.overallScore}/10, passed: ${passed}`);
    console.log(
      `  Scores — distinctiveness: ${parsed.scores.distinctiveness}, code: ${parsed.scores.codeQuality}, brand: ${parsed.scores.brandAlignment}, responsive: ${parsed.scores.responsiveness}, a11y: ${parsed.scores.accessibility}`
    );
    if (parsed.issues.length > 0) {
      console.log(`  Issues: ${parsed.issues.join("; ")}`);
    }

    return {
      passed,
      overallScore: parsed.overallScore,
      scores: parsed.scores,
      critique: parsed.critique,
      issues: parsed.issues,
    };
  } catch (error) {
    console.error("Quality review failed:", error);
    // If review fails, pass by default (don't block generation)
    return {
      passed: true,
      overallScore: 0,
      scores: {
        distinctiveness: 0,
        codeQuality: 0,
        brandAlignment: 0,
        responsiveness: 0,
        accessibility: 0,
      },
      critique: "Review failed — passing by default",
      issues: ["Review API call failed"],
    };
  }
}
