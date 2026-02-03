/**
 * System prompts for AI element editing
 */

import type { QuickAction } from "@/lib/editor/types";

export const ELEMENT_EDIT_SYSTEM_PROMPT = `You are an expert UGC portfolio editor helping a creator edit elements on their portfolio website. You can edit both text content AND visual styling.

## Your Role
- Edit text content and/or visual styling as requested
- Maintain the creator's voice and brand identity
- Return the complete element with your changes applied

## Capabilities
1. **Text Editing**: Rewrite, shorten, expand, change tone
2. **Style Editing**: Change colors, fonts, sizes, weights, spacing, and other CSS properties

## Output Format
Return the FULL outer HTML of the element with your changes applied.
- For a heading: <h2 style="...">Your new content</h2>
- For a paragraph: <p style="...">Your new content</p>
- Include ALL existing inline styles from the original, then add/modify as needed

## Guidelines
1. **Always return full element**: Return the complete HTML element with opening and closing tags
2. **Preserve existing styles**: Keep any existing inline styles unless specifically asked to change them
3. **Use inline styles**: Apply all style changes as inline styles (style="...")
4. **Keep attributes**: Preserve any existing classes, ids, or other attributes from the original element
5. **Match Length**: Unless asked to expand or shorten text, keep similar length
6. **Be Specific**: Use concrete, compelling language for text
7. **Sound Authentic**: Keep the personal, human touch

## Style Guidelines
- Use web-safe CSS properties
- For colors: use hex (#ff6b95), rgb(), or named colors
- For sizes: use rem, em, or px
- For fonts: use font-weight, font-style, font-family
- For spacing: use letter-spacing, line-height, padding, margin

## Example Outputs
Input element: <h2>Welcome to My Portfolio</h2>
Instruction: "Make it red and larger"
Output: <h2 style="color: #e53e3e; font-size: 2.5rem;">Welcome to My Portfolio</h2>

Input element: <p style="color: #333;">I create content.</p>
Instruction: "Make it bold and blue"
Output: <p style="color: #3b82f6; font-weight: 700;">I create content.</p>`;

/**
 * Extract design system information from HTML
 */
export function extractDesignSystem(html: string): {
  colors: string[];
  fonts: string[];
  pageContext: string;
} {
  // Extract colors (hex, rgb, rgba, named colors in style attributes)
  const colorPatterns = [
    /#[0-9a-fA-F]{3,8}/g,
    /rgb\([^)]+\)/g,
    /rgba\([^)]+\)/g,
  ];

  const colorsSet = new Set<string>();
  for (const pattern of colorPatterns) {
    const matches = html.match(pattern) || [];
    matches.forEach(c => colorsSet.add(c.toLowerCase()));
  }

  // Extract font-family values
  const fontMatches = html.match(/font-family:\s*([^;}"]+)/gi) || [];
  const fonts = [...new Set(fontMatches.map(f => f.replace(/font-family:\s*/i, '').trim()))];

  // Extract page context from text content (headings, key phrases)
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
  const metaDesc = html.match(/<meta[^>]*description[^>]*content="([^"]+)"/i);

  let pageContext = '';
  if (h1Match) pageContext += `Main title: "${h1Match[1].trim()}". `;
  if (h2Matches.length > 0) {
    const sections = h2Matches.slice(0, 3).map(h => h.replace(/<[^>]+>/g, '').trim());
    pageContext += `Sections: ${sections.join(', ')}. `;
  }
  if (metaDesc) pageContext += `About: ${metaDesc[1]}`;

  return {
    colors: [...colorsSet].slice(0, 10), // Limit to 10 most used
    fonts: fonts.slice(0, 3),
    pageContext: pageContext || 'A creator portfolio website',
  };
}

/**
 * Build a contextual refresh prompt based on the page's design system
 */
export function buildRefreshPrompt(designSystem: {
  colors: string[];
  fonts: string[];
  pageContext: string;
}): string {
  const { colors, fonts, pageContext } = designSystem;

  const colorPalette = colors.length > 0
    ? `Use colors from this page's existing palette: ${colors.join(', ')}`
    : 'Maintain the current color scheme';

  const fontGuidance = fonts.length > 0
    ? `The page uses these fonts: ${fonts.join(', ')}. Stay consistent with this typography.`
    : '';

  return `Create a fresh variation of this element that fits naturally within this portfolio.

## Page Context
${pageContext}

## Design System Constraints
- ${colorPalette}
- ${fontGuidance}
- Maintain visual consistency with the rest of the page
- Keep the same general structure and purpose

## What to Vary
1. **Text**: Rewrite with different wording or phrasing while keeping the same meaning and tone. Match the voice used elsewhere on this portfolio.
2. **Subtle style tweaks** (optional, only if it improves the design):
   - Slightly adjust font-weight if appropriate
   - Minor spacing adjustments (letter-spacing, line-height)
   - Use a different shade from the existing color palette

## Important
- Do NOT introduce colors that clash with the existing design
- Do NOT change the fundamental structure or purpose
- Keep changes tasteful and professional
- The result should look like it belongs on this page`;
}

export const QUICK_ACTION_PROMPTS: Record<QuickAction, string> = {
  // Text actions
  rewrite: `Rewrite this text with fresh wording while keeping the same meaning. Make it feel newly written, not just rearranged. Keep all existing styles.`,

  shorten: `Make this text more concise. Remove filler words and unnecessary phrases while preserving the key message. Aim for 30-50% shorter. Keep all existing styles.`,

  expand: `Expand this text with more detail and context. Add specific examples or compelling details. Aim for 50-100% longer. Keep all existing styles.`,

  professional: `Rewrite this text in a more polished, professional tone. Make it sound credible and trustworthy while staying approachable. Keep all existing styles.`,

  casual: `Rewrite this text in a friendlier, more conversational tone. Make it feel like talking to a friend while staying professional. Keep all existing styles.`,

  energetic: `Rewrite this text with more energy and excitement. Add enthusiasm and momentum without being over-the-top. Keep all existing styles.`,

  // Style actions
  bolder: `Make this element visually bolder and more prominent. Increase font-weight (use 600, 700, or 800). You may also slightly increase the font-size if appropriate. Keep the text content exactly the same.`,

  larger: `Increase the font size of this element to make it more prominent. Increase by about 20-30%. Keep the text content exactly the same and preserve other styles.`,

  smaller: `Decrease the font size of this element to make it more subtle. Decrease by about 20-30%. Keep the text content exactly the same and preserve other styles.`,

  colorful: `Add a vibrant, eye-catching color to this element. Choose a color that would work well on a portfolio (coral, teal, purple, or similar). Keep the text content exactly the same.`,

  subtle: `Make this element more subtle and understated. Use a softer color (muted gray, lighter shade), reduce font-weight if bold, or decrease opacity slightly. Keep the text content exactly the same.`,

  uppercase: `Transform the text to uppercase and add appropriate letter-spacing (0.05em to 0.1em) for a clean, modern look. Keep the content meaning the same but in uppercase.`,
};

export function buildElementEditPrompt(params: {
  currentContent: string;
  outerHtml: string;
  instruction: string;
  tagName: string;
  quickAction?: QuickAction;
  surroundingContext?: string;
  fullHtml?: string;
  imageUrls?: string[];
}): { systemPrompt: string; userPrompt: string } {
  const { currentContent, outerHtml, instruction, tagName, quickAction, surroundingContext, fullHtml, imageUrls } = params;

  let systemPrompt = ELEMENT_EDIT_SYSTEM_PROMPT;

  // Add element type context
  const elementTypeHints: Record<string, string> = {
    H1: "This is the main headline - make it bold and attention-grabbing",
    H2: "This is a section heading - make it clear and compelling",
    H3: "This is a subheading - make it specific and informative",
    P: "This is a paragraph - maintain readability and flow",
    A: "This is a link text - keep it action-oriented and clear",
    BUTTON: "This is button text - make it action-oriented and concise",
    LI: "This is a list item - keep it scannable and consistent with other items",
    BLOCKQUOTE: "This is a quote - make it impactful and memorable",
    DIV: "This is a text container - preserve the structure while editing",
    SPAN: "This is inline text - keep it concise",
  };

  if (tagName.toUpperCase() in elementTypeHints) {
    systemPrompt += `\n\n## Element Type: ${tagName.toUpperCase()}\n${elementTypeHints[tagName.toUpperCase()]}`;
  }

  let userPrompt = `Edit this ${tagName.toLowerCase()} element:

Current element (full HTML):
${outerHtml}

Current text content:
${currentContent}`;

  if (surroundingContext) {
    userPrompt += `\n\nContext (surrounding content):\n${surroundingContext}`;
  }

  if (quickAction && quickAction in QUICK_ACTION_PROMPTS) {
    userPrompt += `\n\nInstruction: ${QUICK_ACTION_PROMPTS[quickAction]}`;
  } else if (instruction === "randomize" && fullHtml) {
    // Special case for the refresh button - use design system context
    const designSystem = extractDesignSystem(fullHtml);
    const refreshPrompt = buildRefreshPrompt(designSystem);
    userPrompt += `\n\nInstruction: ${refreshPrompt}`;
  } else if (instruction) {
    userPrompt += `\n\nInstruction: ${instruction}`;
  }

  // Add image URL instructions if images were provided
  if (imageUrls && imageUrls.length > 0) {
    userPrompt += `\n\n## Uploaded Image${imageUrls.length > 1 ? 's' : ''}
The user has uploaded ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} that ${imageUrls.length > 1 ? 'are' : 'is'} now stored and ready to use.
${imageUrls.map((url, i) => `Image ${i + 1} URL: ${url}`).join('\n')}

**IMPORTANT**: If the user wants to replace an image or use the uploaded image, you MUST use the exact URL${imageUrls.length > 1 ? 's' : ''} provided above in the src attribute. Do NOT try to embed base64 data or use any other URL.

Example for replacing an <img> element:
<img src="${imageUrls[0]}" alt="Descriptive alt text" style="..." />`;
  }

  userPrompt += `\n\nReturn the complete ${tagName.toLowerCase()} element with your changes applied. Include the opening and closing tags.`;

  return { systemPrompt, userPrompt };
}
