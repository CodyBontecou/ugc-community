import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
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

    const body = await request.json();
    const action = body.action || "generate";

    if (action === "refine") {
      // Handle refinement request
      const { currentContent, feedback } = refineSchema.parse(body);
      const { systemPrompt, userPrompt } = buildRefinePrompt(
        currentContent,
        feedback
      );

      const result = streamText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 2000,
      });

      return result.toTextStreamResponse();
    }

    // Handle generation request
    const { description, niche } = generateSchema.parse(body);
    const { systemPrompt, userPrompt } = buildPrompt(description, niche);

    // Log for debugging (remove in production)
    console.log(`Generating portfolio for user ${session.user.id}`);

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2000,
    });

    return result.toTextStreamResponse();
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
