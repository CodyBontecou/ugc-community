import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { buildElementEditPrompt } from "@/lib/ai/edit-prompts";
import type { QuickAction } from "@/lib/editor/types";

const editElementSchema = z.object({
  portfolioId: z.string().uuid(),
  selector: z.string().min(1),
  currentContent: z.string(),
  outerHtml: z.string().min(1),
  instruction: z.string().max(500).optional(),
  quickAction: z
    .enum([
      // Text actions
      "rewrite", "shorten", "expand", "professional", "casual", "energetic",
      // Style actions
      "bolder", "larger", "smaller", "colorful", "subtle", "uppercase"
    ])
    .optional(),
  fullHtml: z.string().min(1),
  tagName: z.string().min(1),
});

// POST /api/ai/edit-element - Stream AI-generated element edits
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

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
    const data = editElementSchema.parse(body);

    // Validate that either instruction or quickAction is provided
    if (!data.instruction && !data.quickAction) {
      return new Response(
        JSON.stringify({ error: "Either instruction or quickAction is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `Editing element for user ${session.user.id}, portfolio ${data.portfolioId}`
    );

    const { systemPrompt, userPrompt } = buildElementEditPrompt({
      currentContent: data.currentContent,
      outerHtml: data.outerHtml,
      instruction: data.instruction || "",
      tagName: data.tagName,
      quickAction: data.quickAction as QuickAction | undefined,
      fullHtml: data.fullHtml,
    });

    // Use faster model for element edits (lower latency)
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
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

    console.error("AI edit error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate edit" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
