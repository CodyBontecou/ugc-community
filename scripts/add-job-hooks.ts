#!/usr/bin/env tsx
/**
 * Add hooks to a content job directly via the database.
 *
 * Usage:
 *   source .env.local && tsx scripts/add-job-hooks.ts <job-id>
 *
 * Or pipe hooks as JSON:
 *   source .env.local && tsx scripts/add-job-hooks.ts <job-id> --replace
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { jobHooks, contentJobs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL not set. Run: source .env.local first.");
  process.exit(1);
}

const jobId = process.argv[2];
if (!jobId) {
  console.error("Usage: tsx scripts/add-job-hooks.ts <job-id> [--replace]");
  process.exit(1);
}

const replace = process.argv.includes("--replace");

// ---------------------------------------------------------------------------
// Hooks to insert
// ---------------------------------------------------------------------------
const hooks: { hookText: string; screenshotUrl?: string }[] = [
  {
    hookText:
      "POV: you finally have a portfolio that actually gets you brand deals 👀",
  },
  {
    hookText:
      "I built my entire UGC portfolio in one afternoon — here's exactly how",
  },
  {
    hookText:
      "Brands are choosing creators based on portfolios now — is yours good enough?",
  },
  {
    hookText:
      "If you don't have a portfolio as a UGC creator, you're leaving money on the table",
  },
  {
    hookText:
      "This free tool built me a professional UGC portfolio in minutes — no design skills needed",
  },
  {
    hookText:
      "The #1 reason brands ghost UGC creators (and how to fix it today)",
  },
  {
    hookText:
      "Watch me go from zero to a full UGC portfolio live — no experience required",
  },
  {
    hookText: "What a $500/month UGC creator's portfolio actually looks like",
  },
  {
    hookText:
      "I asked 10 brands what they look for in a UGC portfolio — here's what they said",
  },
  {
    hookText:
      "Stop sending brands your Instagram link — do this instead",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const client = neon(DATABASE_URL!);
  const db = drizzle(client);

  // Verify the job exists
  const job = await db
    .select({ id: contentJobs.id, title: contentJobs.title })
    .from(contentJobs)
    .where(eq(contentJobs.id, jobId))
    .limit(1);

  if (!job[0]) {
    console.error(`❌  Job not found: ${jobId}`);
    process.exit(1);
  }

  console.log(`\n📋 Job: "${job[0].title}" (${jobId})`);

  // Optionally clear existing hooks
  if (replace) {
    await db.delete(jobHooks).where(eq(jobHooks.jobId, jobId));
    console.log("🗑️  Cleared existing hooks.");
  }

  // Get current max sort order
  const maxResult = await db
    .select({ max: sql<number>`coalesce(max(${jobHooks.sortOrder}), -1)` })
    .from(jobHooks)
    .where(eq(jobHooks.jobId, jobId));
  let startOrder = (maxResult[0]?.max ?? -1) + 1;

  // Insert hooks
  const values = hooks.map((h, i) => ({
    jobId,
    hookText: h.hookText,
    screenshotUrl: h.screenshotUrl || null,
    sortOrder: startOrder + i,
  }));

  const inserted = await db.insert(jobHooks).values(values).returning();

  console.log(`\n✅  Added ${inserted.length} hooks:\n`);
  inserted.forEach((h, i) => {
    console.log(`  ${i + 1}. "${h.hookText}"`);
  });
  console.log();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
