import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { buildPrompt, buildRefinePrompt } from "@/lib/ai/prompts";

const generateSchema = z.object({
  description: z.string().min(10).max(2000),
  niche: z.string().optional(),
  templateId: z.string().optional(),
});

const refineSchema = z.object({
  currentContent: z.string(),
  feedback: z.string().min(1).max(1000),
});

// POST /api/ai/generate - Generate portfolio content
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
    const action = body.action || "generate";

    let systemPrompt: string;
    let userPrompt: string;

    if (action === "refine") {
      const { currentContent, feedback } = refineSchema.parse(body);
      const prompts = buildRefinePrompt(currentContent, feedback);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    } else {
      const { description, niche } = generateSchema.parse(body);
      const prompts = buildPrompt(description, niche);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    }

    console.log(`Generating portfolio for user ${session.user.id}`);

    // Create streaming response
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
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
