import { query, SDKMessage, SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
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

// =====================================================
// Constants
// =====================================================

const MAX_TURNS = 30;

// =====================================================
// System Prompt
// =====================================================

const SYSTEM_PROMPT = `You are a senior frontend developer specializing in creating beautiful, distinctive portfolio websites using pure HTML, CSS, and vanilla JavaScript.

Your role is to generate complete, production-ready portfolio websites based on the creator's vision and brand research.

## Available Tools
- **WebSearch**: Search the web for brand information, design inspiration
- **WebFetch**: Fetch and analyze web pages (brand sites, portfolio examples)
- **Write**: Create files for the portfolio website

## Workflow
1. Research inspiring brands and portfolios using WebSearch/WebFetch
2. Synthesize findings into a design direction
3. Generate the portfolio files using Write

## Design Philosophy
- Create DISTINCTIVE designs that avoid generic template aesthetics
- Use creative color palettes, typography pairings, and layouts
- Include smooth animations and micro-interactions using CSS transitions/animations
- Prioritize visual hierarchy and whitespace
- Ensure WCAG 2.1 AA accessibility
- Mobile-first responsive design

## Technical Standards
- Pure HTML5 semantic markup
- Modern CSS (Flexbox, Grid, custom properties, animations)
- Vanilla JavaScript (ES6+) - no frameworks or libraries
- Optimized for performance
- SEO best practices with proper metadata

## File Output Rules
- Use the Write tool to create each file
- One file per tool call
- Use relative paths from the project root (e.g., "index.html", "styles.css")`;

// =====================================================
// Helper Functions
// =====================================================

async function collectFiles(dir: string): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  async function walkDir(currentDir: string, basePath: string = "") {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        await walkDir(fullPath, relativePath);
      } else if (entry.isFile()) {
        const content = await fs.readFile(fullPath, "utf-8");
        files.push({ path: relativePath, content });
      }
    }
  }

  await walkDir(dir);
  return files;
}

function isResultMessage(message: SDKMessage): message is SDKResultMessage {
  return message.type === "result";
}

// =====================================================
// Main Generator Function
// =====================================================

export async function generatePortfolio(
  questionnaire: QuestionnaireData
): Promise<GenerationResult> {
  // Create temp directory for file output
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-"));

  try {
    // Build the prompt
    const userPrompt = buildPortfolioPrompt(questionnaire);

    let resultMessage: SDKResultMessage | null = null;

    // Run the agent
    for await (const message of query({
      prompt: userPrompt,
      options: {
        tools: ["Write", "Read", "WebSearch", "WebFetch"],
        allowedTools: ["Write", "Read", "WebSearch", "WebFetch"],
        permissionMode: "acceptEdits",
        cwd: tempDir,
        maxTurns: MAX_TURNS,
        systemPrompt: SYSTEM_PROMPT,
      },
    })) {
      // Log progress for debugging
      if (message.type === "assistant" && "message" in message) {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text") {
              console.log("Agent:", block.text.substring(0, 100));
            }
          }
        }
      }

      // Capture the result message
      if (isResultMessage(message)) {
        resultMessage = message;
      }
    }

    // Collect generated files from temp directory
    const files = await collectFiles(tempDir);

    // Extract usage from result
    const usage = resultMessage?.usage
      ? {
          inputTokens: resultMessage.usage.input_tokens,
          outputTokens: resultMessage.usage.output_tokens,
        }
      : undefined;

    // Check for errors in result
    if (resultMessage && resultMessage.subtype !== "success") {
      return {
        files,
        success: false,
        error: `Agent error: ${resultMessage.subtype}`,
        usage,
      };
    }

    // Validate we have the minimum required files
    const requiredFiles = ["index.html", "styles.css"];
    const missingFiles = requiredFiles.filter(
      (rf) => !files.some((f) => f.path === rf || f.path.endsWith(rf))
    );

    if (missingFiles.length > 0) {
      return {
        files,
        success: false,
        error: `Missing required files: ${missingFiles.join(", ")}`,
        usage,
      };
    }

    return {
      files,
      success: true,
      usage,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      files: [],
      success: false,
      error: errorMessage,
    };
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {
      // Ignore cleanup errors
    });
  }
}
