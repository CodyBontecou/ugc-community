import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generatePortfolioFunction } from "@/lib/inngest/functions/generate-portfolio";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generatePortfolioFunction],
});
