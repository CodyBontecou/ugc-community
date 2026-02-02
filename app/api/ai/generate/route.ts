import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { buildHtmlPrompt, buildHtmlRefinePrompt } from "@/lib/ai/prompts";

const imageSchema = z.object({
  mediaType: z.string(),
  data: z.string(), // base64 encoded image data
});

const generateSchema = z.object({
  description: z.string().min(10).max(2000),
  niche: z.string().optional(),
  model: z.string().optional(),
  images: z.array(imageSchema).optional(),
});

const htmlRefineSchema = z.object({
  currentHtml: z.string(),
  feedback: z.string().min(1).max(1000),
  model: z.string().optional(),
  images: z.array(imageSchema).optional(),
});

// POST /api/ai/generate - Generate HTML portfolio content
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Ensure we have the API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const body = await request.json();
    const action = body.action || "generate-html";

    let systemPrompt: string;
    let userPrompt: string;
    const maxTokens = 16000;
    let selectedModel = "claude-sonnet-4-5";
    let images: { mediaType: string; data: string }[] | undefined;

    if (action === "refine-html") {
      // HTML refinement
      const parsed = htmlRefineSchema.parse(body);
      const prompts = buildHtmlRefinePrompt(parsed.currentHtml, parsed.feedback);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
      selectedModel = parsed.model || selectedModel;
      images = parsed.images;
    } else {
      // Default to HTML generation
      const parsed = generateSchema.parse(body);
      const prompts = buildHtmlPrompt(parsed.description, parsed.niche);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
      selectedModel = parsed.model || selectedModel;
      images = parsed.images;
    }

    console.log(
      `Generating portfolio (${action}) for user ${session.user.id}`
    );

    // Build message content with optional images
    const messageContent: Anthropic.MessageParam["content"] = [];
    
    // Add images first if provided
    if (images && images.length > 0) {
      for (const image of images) {
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: image.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: image.data,
          },
        });
      }
    }
    
    // Add text prompt
    messageContent.push({ type: "text", text: userPrompt });

    // Create streaming response
    const stream = anthropic.messages.stream({
      model: selectedModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: messageContent }],
    });

    // Create a ReadableStream that emits text chunks
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        stream.on("text", (text) => {
          controller.enqueue(encoder.encode(text));
        });

        stream.on("error", (error) => {
          console.error("Stream error:", error);
          controller.error(error);
        });

        stream.on("end", () => {
          controller.close();
        });

        // Wait for the stream to complete
        await stream.finalMessage();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("AI generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate content" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
