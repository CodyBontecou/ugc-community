import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generatePortfolioFunction } from "@/lib/inngest/functions/generate-portfolio";

// Increase function timeout for long-running portfolio generation
// Vercel Pro: max 300s, Hobby: max 60s
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generatePortfolioFunction],
});
