import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const payloadSchema = z.object({
  provider: z.enum(["chatgpt", "perplexity", "claude", "copilot", "gemini"]),
  path: z.string().max(500).refine((value) => value.startsWith("/")),
});

export async function POST(request: NextRequest) {
  try {
    const payload = payloadSchema.parse(await request.json());
    console.info(JSON.stringify({
      event: "ai_referral",
      provider: payload.provider,
      path: payload.path,
      recordedAt: new Date().toISOString(),
    }));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid referral event" }, { status: 400 });
  }
}
