/**
 * System prompts for AI element editing
 */

import type { QuickAction } from "@/lib/editor/types";

export const ELEMENT_EDIT_SYSTEM_PROMPT = `You are an expert UGC portfolio copywriter helping a creator edit specific text elements on their portfolio website.

## Your Role
- Edit ONLY the specific text content provided
- Maintain the creator's voice and brand identity
- Keep the same general meaning unless asked to change it
- Return ONLY the edited text content, no explanations

## Guidelines
1. **Preserve HTML**: If the content contains HTML tags (like <span>, <strong>, <br>), preserve them appropriately
2. **Match Length**: Unless asked to expand or shorten, keep similar length
3. **Maintain Tone**: Match the existing writing style
4. **Be Specific**: Use concrete, compelling language
5. **Sound Authentic**: Keep the personal, human touch

## Output Format
Return ONLY the new text content for the element. No explanations, no quotes, no markdown.
If the element contains HTML, return valid HTML content.`;

export const QUICK_ACTION_PROMPTS: Record<QuickAction, string> = {
  rewrite: `Rewrite this text with fresh wording while keeping the same meaning. Make it feel newly written, not just rearranged.`,

  shorten: `Make this text more concise. Remove filler words and unnecessary phrases while preserving the key message. Aim for 30-50% shorter.`,

  expand: `Expand this text with more detail and context. Add specific examples or compelling details. Aim for 50-100% longer.`,

  professional: `Rewrite this text in a more polished, professional tone. Make it sound credible and trustworthy while staying approachable.`,

  casual: `Rewrite this text in a friendlier, more conversational tone. Make it feel like talking to a friend while staying professional.`,

  energetic: `Rewrite this text with more energy and excitement. Add enthusiasm and momentum without being over-the-top.`,
};

export function buildElementEditPrompt(params: {
  currentContent: string;
  instruction: string;
  tagName: string;
  quickAction?: QuickAction;
  surroundingContext?: string;
}): { systemPrompt: string; userPrompt: string } {
  const { currentContent, instruction, tagName, quickAction, surroundingContext } = params;

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
  };

  if (tagName.toUpperCase() in elementTypeHints) {
    systemPrompt += `\n\n## Element Type: ${tagName.toUpperCase()}\n${elementTypeHints[tagName.toUpperCase()]}`;
  }

  let userPrompt = `Edit this ${tagName.toLowerCase()} element:\n\nCurrent content:\n${currentContent}`;

  if (surroundingContext) {
    userPrompt += `\n\nContext (surrounding content):\n${surroundingContext}`;
  }

  if (quickAction && quickAction in QUICK_ACTION_PROMPTS) {
    userPrompt += `\n\nInstruction: ${QUICK_ACTION_PROMPTS[quickAction]}`;
  } else if (instruction) {
    userPrompt += `\n\nInstruction: ${instruction}`;
  }

  userPrompt += `\n\nReturn ONLY the new content for this element.`;

  return { systemPrompt, userPrompt };
}
