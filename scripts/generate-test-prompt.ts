import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "@/lib/db";
import { onboardingQuestionnaires, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { buildPortfolioPrompt } from "@/lib/agent/portfolio-prompt";

async function main() {
  // Get the most recent questionnaire with user info
  const results = await db
    .select({
      questionnaire: onboardingQuestionnaires,
      user: {
        name: users.name,
        subdomain: users.subdomain,
      },
    })
    .from(onboardingQuestionnaires)
    .innerJoin(users, eq(onboardingQuestionnaires.userId, users.id))
    .orderBy(desc(onboardingQuestionnaires.createdAt))
    .limit(1);

  if (results.length === 0) {
    console.error("No questionnaires found in database");
    process.exit(1);
  }

  const { questionnaire, user } = results[0];

  console.log("=".repeat(80));
  console.log("QUESTIONNAIRE DATA:");
  console.log("=".repeat(80));
  console.log(`Creator: ${user.name}`);
  console.log(`Subdomain: ${user.subdomain}`);
  console.log(`Vision: ${questionnaire.portfolioVision}`);
  console.log(`Inspiring Brands: ${questionnaire.inspiringBrands || "(none)"}`);
  console.log(`Portfolio Examples: ${questionnaire.portfolioExamples || "(none)"}`);
  console.log("=".repeat(80));
  console.log("\n");

  // Generate the prompt using our new pipeline
  const prompt = buildPortfolioPrompt({
    portfolioVision: questionnaire.portfolioVision,
    inspiringBrands: questionnaire.inspiringBrands,
    portfolioExamples: questionnaire.portfolioExamples,
    creatorName: user.name,
    subdomain: user.subdomain || "test",
  });

  console.log("=".repeat(80));
  console.log("GENERATED PROMPT:");
  console.log("=".repeat(80));
  console.log(prompt);
  console.log("=".repeat(80));
}

main().catch(console.error);
