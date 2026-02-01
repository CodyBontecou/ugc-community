#!/usr/bin/env tsx
/**
 * Portfolio Generator CLI Script
 *
 * Generates a portfolio website from a questionnaire submission.
 *
 * Usage:
 *   pnpm tsx scripts/generate-portfolio.ts <questionnaire-id>
 *
 * The generated files will be output to a temporary directory.
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";

import * as schema from "../lib/db/schema";
import { generatePortfolio } from "../lib/agent/portfolio-generator";
import { QuestionnaireData } from "../lib/agent/portfolio-prompt";

// Load environment variables
config({ path: ".env.local" });

// =====================================================
// Database Setup
// =====================================================

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

// =====================================================
// Main Script
// =====================================================

async function main() {
  const questionnaireId = process.argv[2];

  if (!questionnaireId) {
    console.error("Usage: pnpm tsx scripts/generate-portfolio.ts <questionnaire-id>");
    console.error("");
    console.error("Example:");
    console.error("  pnpm tsx scripts/generate-portfolio.ts abc123-def456-...");
    process.exit(1);
  }

  // Validate ANTHROPIC_API_KEY
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("Portfolio Generator CLI");
  console.log("=======================\n");

  const db = getDb();

  // Step 1: Load questionnaire
  console.log(`Loading questionnaire: ${questionnaireId}`);

  const questionnaires = await db
    .select({
      id: schema.onboardingQuestionnaires.id,
      userId: schema.onboardingQuestionnaires.userId,
      portfolioVision: schema.onboardingQuestionnaires.portfolioVision,
      inspiringBrands: schema.onboardingQuestionnaires.inspiringBrands,
      portfolioExamples: schema.onboardingQuestionnaires.portfolioExamples,
      userName: schema.users.name,
      userSubdomain: schema.users.subdomain,
    })
    .from(schema.onboardingQuestionnaires)
    .innerJoin(schema.users, eq(schema.onboardingQuestionnaires.userId, schema.users.id))
    .where(eq(schema.onboardingQuestionnaires.id, questionnaireId));

  if (questionnaires.length === 0) {
    console.error(`Error: Questionnaire not found: ${questionnaireId}`);
    process.exit(1);
  }

  const q = questionnaires[0];
  console.log(`  Creator: ${q.userName}`);
  console.log(`  Subdomain: ${q.userSubdomain || "(not set)"}`);
  console.log("");

  // Step 2: Prepare questionnaire data
  const questionnaireData: QuestionnaireData = {
    portfolioVision: q.portfolioVision,
    inspiringBrands: q.inspiringBrands,
    portfolioExamples: q.portfolioExamples,
    creatorName: q.userName,
    subdomain: q.userSubdomain || "creator",
  };

  console.log("Portfolio Vision:");
  console.log(`  ${q.portfolioVision.substring(0, 100)}...`);
  console.log("");

  if (q.inspiringBrands) {
    console.log("Inspiring Brands:");
    console.log(`  ${q.inspiringBrands}`);
    console.log("");
  }

  // Step 3: Generate portfolio
  console.log("Generating portfolio with Claude...");
  console.log("(This may take a few minutes)\n");

  const startTime = Date.now();
  const result = await generatePortfolio(questionnaireData);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!result.success) {
    console.error(`\nError: Generation failed`);
    console.error(`  ${result.error}`);
    console.error(`\nPartially generated ${result.files.length} files`);
    process.exit(1);
  }

  console.log(`Generation complete in ${duration}s`);
  console.log(`  Files generated: ${result.files.length}`);
  if (result.usage) {
    console.log(`  Input tokens: ${result.usage.inputTokens.toLocaleString()}`);
    console.log(`  Output tokens: ${result.usage.outputTokens.toLocaleString()}`);
  }
  console.log("");

  // Step 4: Write files to temp directory
  const outputDir = join(
    tmpdir(),
    `portfolio-${q.userSubdomain || "creator"}-${Date.now()}`
  );
  console.log(`Writing files to: ${outputDir}\n`);

  await mkdir(outputDir, { recursive: true });

  for (const file of result.files) {
    const filePath = join(outputDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });

    // Handle binary files (base64 encoded) vs text files
    if (file.isBinary) {
      await writeFile(filePath, Buffer.from(file.content, "base64"));
      console.log(`  Created: ${file.path} (binary)`);
    } else {
      await writeFile(filePath, file.content, "utf-8");
      console.log(`  Created: ${file.path}`);
    }
  }

  console.log("\n=======================");
  console.log("Portfolio generation complete!");
  console.log(`\nOutput directory: ${outputDir}`);
  console.log(`\nTo preview locally:`);
  console.log(`  cd ${outputDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
