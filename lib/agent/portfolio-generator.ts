import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { buildPortfolioPrompt, QuestionnaireData } from "./portfolio-prompt";
import { generatePortfolioFavicon, FaviconResult } from "./favicon-generator";

// =====================================================
// Types
// =====================================================

export interface GeneratedFile {
  path: string;
  content: string;
  /** If true, content is base64-encoded binary data */
  isBinary?: boolean;
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

interface ToolResult {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// =====================================================
// Constants
// =====================================================

// No timeout constraints with Fly worker - allow full generation
const MAX_TURNS = 30;
const MODEL = "claude-sonnet-4-5";

// =====================================================
// System Prompt
// =====================================================

const SYSTEM_PROMPT = `You are a senior frontend developer creating distinctive, production-grade portfolio websites that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## CRITICAL CONSTRAINT: Files Allowed
You may ONLY create these three files:
- index.html
- styles.css
- script.js

Do NOT create any other files (no .json, .md, .ts, .tsx, .jsx, .vue, etc.). Only pure HTML, CSS, and JavaScript.

## Tools
- **write_file**: Create files (ONLY index.html, styles.css, script.js)
- **web_fetch**: Fetch a URL if specific portfolio examples are provided (use sparingly)

## CRITICAL: Be Efficient
- Limit research to 1-2 web_fetch calls maximum (only if URLs are provided)
- Start writing files immediately after minimal research
- Create all files in sequence: index.html → styles.css → script.js

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

## Technical Standards
- Semantic HTML5
- Modern CSS (Flexbox, Grid, custom properties)
- Vanilla JavaScript (ES6+) - no frameworks, no build tools
- Mobile-first responsive design
- WCAG 2.1 AA accessibility
- SEO metadata

## Contact Form Requirements
The Contact section MUST include a working form with id="contact-form" and these fields:
- Name input with name="name" (required)
- Email input with name="email" (required)
- Company/Brand input with name="company" (required)
- Message textarea with name="message" (required)
- Submit button with type="submit"

Example structure:
\`\`\`html
<form id="contact-form">
  <input type="text" name="name" placeholder="Your Name" required>
  <input type="email" name="email" placeholder="Email Address" required>
  <input type="text" name="company" placeholder="Brand / Company" required>
  <textarea name="message" placeholder="Project Details" required></textarea>
  <button type="submit">Send Message</button>
</form>
\`\`\`

The form submission handler will be automatically injected - just create the form HTML.

## Output
Create ONLY these three files:
1. index.html - Complete page with Hero, Portfolio, About, Contact sections (include working contact form)
2. styles.css - All styling including responsive breakpoints
3. script.js - Interactions and smooth scrolling

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.`;

// =====================================================
// Tool Definitions
// =====================================================

const tools: Anthropic.Tool[] = [
  {
    name: "write_file",
    description:
      "Write content to a file. Use relative paths from the project root (e.g., 'index.html', 'styles.css', 'js/main.js').",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The relative file path to write to",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file you have previously created.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The relative file path to read",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "web_fetch",
    description:
      "Fetch and read the content of a web page. Returns the page content as text (HTML stripped to readable text for analysis).",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "web_search",
    description:
      "Search the web for information. Returns search results with titles, URLs, and snippets.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
];

// =====================================================
// Tool Execution Handlers
// =====================================================

async function executeWriteFile(
  tempDir: string,
  filePath: string,
  content: string
): Promise<string> {
  const fullPath = path.join(tempDir, filePath);
  const dir = path.dirname(fullPath);

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });

  // Write the file
  await fs.writeFile(fullPath, content, "utf-8");

  return `Successfully wrote ${content.length} characters to ${filePath}`;
}

async function executeReadFile(
  tempDir: string,
  filePath: string
): Promise<string> {
  const fullPath = path.join(tempDir, filePath);

  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return content;
  } catch {
    return `Error: File not found: ${filePath}`;
  }
}

async function executeWebFetch(url: string): Promise<string> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "Error: Only HTTP and HTTPS URLs are supported";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PortfolioGenerator/1.0; +https://ugc.community)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return `Error: HTTP ${response.status} - ${response.statusText}`;
    }

    const html = await response.text();

    // Simple HTML to text conversion - extract meaningful content
    const text = html
      // Remove script and style tags with content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Extract title
      .replace(/<title[^>]*>(.*?)<\/title>/gi, "TITLE: $1\n\n")
      // Convert headers to readable format
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n## $1\n")
      // Convert paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      // Convert list items
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim();

    // Truncate if too long
    const maxLength = 8000;
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "\n\n[Content truncated...]";
    }

    return text || "No readable content found on the page.";
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return "Error: Request timed out after 15 seconds";
      }
      return `Error fetching URL: ${error.message}`;
    }
    return "Error: Unknown error fetching URL";
  }
}

async function executeWebSearch(query: string): Promise<string> {
  // Check for Brave Search API key
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (braveApiKey) {
    try {
      const params = new URLSearchParams({
        q: query,
        count: "5",
      });

      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?${params}`,
        {
          headers: {
            Accept: "application/json",
            "X-Subscription-Token": braveApiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results = data.web?.results || [];

        if (results.length === 0) {
          return "No search results found.";
        }

        return results
          .slice(0, 5)
          .map(
            (r: { title: string; url: string; description?: string }, i: number) =>
              `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.description || ""}`
          )
          .join("\n\n");
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: Return guidance to use web_fetch directly
  return `Search functionality is limited. Here are suggestions for "${query}":

1. If searching for a brand, try fetching their likely website directly:
   - For brand "Example": try web_fetch with https://example.com or https://www.example.com

2. If searching for portfolio inspiration, try these popular portfolio sites:
   - https://dribbble.com
   - https://behance.net
   - https://awwwards.com

3. Try fetching the specific URLs mentioned by the user in their questionnaire.

Use the web_fetch tool to analyze any URLs you want to research.`;
}

async function executeTool(
  tempDir: string,
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "write_file":
      return executeWriteFile(
        tempDir,
        input.path as string,
        input.content as string
      );
    case "read_file":
      return executeReadFile(tempDir, input.path as string);
    case "web_fetch":
      return executeWebFetch(input.url as string);
    case "web_search":
      return executeWebSearch(input.query as string);
    default:
      return `Error: Unknown tool: ${name}`;
  }
}

// =====================================================
// Post-Processing Functions
// =====================================================

/**
 * Add favicon files to the generated files array.
 */
function addFaviconFiles(
  files: GeneratedFile[],
  faviconResult: FaviconResult
): GeneratedFile[] {
  // Add PNG and ICO files as base64-encoded binary
  for (const [filename, buffer] of Object.entries(faviconResult.files)) {
    files.push({
      path: filename,
      content: buffer.toString("base64"),
      isBinary: true,
    });
  }

  // Add webmanifest (text file)
  files.push({
    path: "site.webmanifest",
    content: faviconResult.webmanifest,
  });

  return files;
}

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

// =====================================================
// Main Generator Function
// =====================================================

export async function generatePortfolio(
  questionnaire: QuestionnaireData
): Promise<GenerationResult> {
  // Create temp directory for file output
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-"));

  // Initialize Anthropic client
  const client = new Anthropic();

  // Track token usage
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // Build the prompt
    const userPrompt = buildPortfolioPrompt(questionnaire);

    // Initialize conversation
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userPrompt },
    ];

    // Run the agent loop
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      console.log(`Turn ${turn + 1}/${MAX_TURNS}`);

      // Call Claude
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 16384,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      // Track usage
      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // Log text responses
      for (const block of response.content) {
        if (block.type === "text") {
          console.log("Agent:", block.text.substring(0, 100));
        }
      }

      // Check if we're done (no more tool calls)
      if (response.stop_reason === "end_turn") {
        console.log("Agent completed (end_turn)");
        break;
      }

      // Extract tool uses
      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      if (toolUses.length === 0) {
        console.log("Agent completed (no tool calls)");
        break;
      }

      // Execute tools and collect results
      const toolResults: ToolResult[] = [];

      for (const toolUse of toolUses) {
        console.log(`Executing tool: ${toolUse.name}`);

        try {
          const result = await executeTool(
            tempDir,
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Error: ${errorMessage}`,
            is_error: true,
          });
        }
      }

      // Add assistant response and tool results to messages
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    }

    // Collect generated files from temp directory
    let files = await collectFiles(tempDir);

    // Generate favicon (runs in parallel with file collection conceptually)
    console.log("Generating favicon...");
    const faviconResult = await generatePortfolioFavicon(
      questionnaire.creatorName,
      questionnaire.portfolioVision
    );

    // Add favicon files if generation succeeded
    if (faviconResult) {
      files = addFaviconFiles(files, faviconResult);
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
      files: [],
      success: false,
      error: errorMessage,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      },
    };
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {
      // Ignore cleanup errors
    });
  }
}
