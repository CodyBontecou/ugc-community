import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processVideoFunction } from "@/lib/inngest/functions/process-video";

// Increase function timeout for long-running background jobs
// Vercel Pro: max 300s, Hobby: max 60s
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processVideoFunction],
});
