import Anthropic from "@anthropic-ai/sdk";
import { buildPortfolioPrompt, QuestionnaireData } from "./portfolio-prompt";

// =====================================================
// Types
// =====================================================

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  success: boolean;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface WriteFileInput {
  file_path: string;
  content: string;
}

// =====================================================
// Constants
// =====================================================

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 16384;
const MAX_ITERATIONS = 30;

// =====================================================
// System Prompt
// =====================================================

const SYSTEM_PROMPT = `You are a senior frontend developer specializing in creating beautiful, distinctive portfolio websites using Next.js 14, TypeScript, and Tailwind CSS.

Your role is to generate complete, production-ready portfolio websites based on the creator's vision and brand research.

## Design Philosophy
- Create DISTINCTIVE designs that avoid generic template aesthetics
- Use creative color palettes, typography pairings, and layouts
- Include smooth animations and micro-interactions
- Prioritize visual hierarchy and whitespace
- Ensure WCAG 2.1 AA accessibility
- Mobile-first responsive design

## Technical Standards
- Next.js 14 with App Router (app/ directory structure)
- TypeScript for type safety
- Tailwind CSS for styling
- Optimized for performance (minimal JS, optimized images)
- SEO best practices with proper metadata

## File Output Rules
- Use the write_file tool to create each file
- One file per tool call
- Include all necessary configuration files
- Use relative paths from the project root (e.g., "app/page.tsx")`;

// =====================================================
// Tool Definitions
// =====================================================

const TOOLS: Anthropic.Tool[] = [
  {
    name: "write_file",
    description: "Write content to a file. Use this to create each file for the portfolio website.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The relative path of the file to create (e.g., 'app/page.tsx')",
        },
        content: {
          type: "string",
          description: "The complete content of the file",
        },
      },
      required: ["file_path", "content"],
    },
  },
  {
    name: "generation_complete",
    description: "Call this when you have finished generating all files for the portfolio.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: {
          type: "string",
          description: "A brief summary of what was generated",
        },
      },
      required: ["summary"],
    },
  },
];

// =====================================================
// Main Generator Function
// =====================================================

export async function generatePortfolio(
  questionnaire: QuestionnaireData
): Promise<GenerationResult> {
  const client = new Anthropic();
  const files: GeneratedFile[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Build the initial prompt
  const userPrompt = buildPortfolioPrompt(questionnaire);

  // Initialize conversation
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  try {
    let iteration = 0;
    let isComplete = false;

    while (!isComplete && iteration < MAX_ITERATIONS) {
      iteration++;

      // Call Claude
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      // Track usage
      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // Process response content
      const toolUses: ToolUseBlock[] = [];
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const toolUse = block as ToolUseBlock;
          toolUses.push(toolUse);

          if (toolUse.name === "write_file") {
            const input = toolUse.input as unknown as WriteFileInput;
            files.push({
              path: input.file_path,
              content: input.content,
            });
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: `File written: ${input.file_path}`,
            });
          } else if (toolUse.name === "generation_complete") {
            isComplete = true;
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: "Generation complete",
            });
          }
        }
      }

      // If stop_reason is end_turn without tool use, we're done
      if (response.stop_reason === "end_turn" && toolUses.length === 0) {
        isComplete = true;
        break;
      }

      // Add assistant message and tool results to conversation
      if (toolUses.length > 0) {
        messages.push({ role: "assistant", content: response.content });
        messages.push({ role: "user", content: toolResults });
      }
    }

    // Validate we have the minimum required files
    const requiredFiles = [
      "app/layout.tsx",
      "app/page.tsx",
      "package.json",
      "tailwind.config.ts",
    ];

    const missingFiles = requiredFiles.filter(
      (rf) => !files.some((f) => f.path === rf || f.path.endsWith(rf))
    );

    if (missingFiles.length > 0) {
      return {
        files,
        success: false,
        error: `Missing required files: ${missingFiles.join(", ")}`,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    }

    return {
      files,
      success: true,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      files,
      success: false,
      error: errorMessage,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      },
    };
  }
}
