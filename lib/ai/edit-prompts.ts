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
}): { systemPrompt: string; userPrompt: string } {
  const { currentContent, outerHtml, instruction, tagName, quickAction, surroundingContext } = params;

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
  } else if (instruction) {
    userPrompt += `\n\nInstruction: ${instruction}`;
  }

  userPrompt += `\n\nReturn the complete ${tagName.toLowerCase()} element with your changes applied. Include the opening and closing tags.`;

  return { systemPrompt, userPrompt };
}
