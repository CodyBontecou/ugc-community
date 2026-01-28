/**
 * Data Migration: Single Portfolio Per User
 *
 * This script consolidates users with multiple portfolios down to one.
 * Run BEFORE applying the unique constraint migration (0002_nebulous_carlie_cooper.sql).
 *
 * Strategy:
 * 1. Find users with multiple portfolios
 * 2. Keep the "best" portfolio (published > recently updated)
 * 3. Reassign media from deleted portfolios to the kept one
 * 4. Delete extra portfolios (cascade handles sections, contact_submissions)
 *
 * Usage: npx tsx scripts/migrate-single-portfolio.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql, desc, and, ne, inArray } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = neon(databaseUrl);
const db = drizzle(client, { schema });

interface PortfolioInfo {
  id: string;
  userId: string;
  isPublished: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

interface MigrationResult {
  usersAffected: number;
  portfoliosDeleted: number;
  mediaReassigned: number;
  errors: string[];
}

async function findUsersWithMultiplePortfolios(): Promise<string[]> {
  const result = await db
    .select({
      userId: schema.portfolios.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.portfolios)
    .groupBy(schema.portfolios.userId)
    .having(sql`count(*) > 1`);

  return result.map((r) => r.userId);
}

async function getPortfoliosForUser(userId: string): Promise<PortfolioInfo[]> {
  const portfolios = await db
    .select({
      id: schema.portfolios.id,
      userId: schema.portfolios.userId,
      isPublished: schema.portfolios.isPublished,
      publishedAt: schema.portfolios.publishedAt,
      updatedAt: schema.portfolios.updatedAt,
      createdAt: schema.portfolios.createdAt,
    })
    .from(schema.portfolios)
    .where(eq(schema.portfolios.userId, userId))
    .orderBy(
      desc(schema.portfolios.isPublished),
      desc(schema.portfolios.publishedAt),
      desc(schema.portfolios.updatedAt)
    );

  return portfolios;
}

function selectBestPortfolio(portfolios: PortfolioInfo[]): PortfolioInfo {
  // Priority: published > most recently updated
  // The query already orders by this, so first is best
  return portfolios[0];
}

async function reassignMedia(
  fromPortfolioIds: string[],
  toPortfolioId: string
): Promise<number> {
  if (fromPortfolioIds.length === 0) return 0;

  const result = await db
    .update(schema.media)
    .set({ portfolioId: toPortfolioId })
    .where(inArray(schema.media.portfolioId, fromPortfolioIds));

  // Drizzle doesn't return count directly for neon-http, estimate from input
  const mediaCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.media)
    .where(eq(schema.media.portfolioId, toPortfolioId));

  return mediaCount[0]?.count ?? 0;
}

async function deletePortfolios(portfolioIds: string[]): Promise<void> {
  if (portfolioIds.length === 0) return;

  // Cascade will handle: portfolio_sections, contact_submissions
  // Media has ON DELETE SET NULL, but we've already reassigned it
  await db
    .delete(schema.portfolios)
    .where(inArray(schema.portfolios.id, portfolioIds));
}

async function migrateUser(userId: string): Promise<{
  deleted: number;
  mediaReassigned: number;
}> {
  const portfolios = await getPortfoliosForUser(userId);
  if (portfolios.length <= 1) {
    return { deleted: 0, mediaReassigned: 0 };
  }

  const bestPortfolio = selectBestPortfolio(portfolios);
  const portfoliosToDelete = portfolios
    .filter((p) => p.id !== bestPortfolio.id)
    .map((p) => p.id);

  console.log(
    `  User ${userId}: keeping portfolio ${bestPortfolio.id}, deleting ${portfoliosToDelete.length} others`
  );

  // Reassign media before deleting portfolios
  const mediaReassigned = await reassignMedia(
    portfoliosToDelete,
    bestPortfolio.id
  );

  // Update creator_directory if it points to a portfolio being deleted
  await db
    .update(schema.creatorDirectory)
    .set({ portfolioId: bestPortfolio.id })
    .where(
      and(
        eq(schema.creatorDirectory.userId, userId),
        inArray(schema.creatorDirectory.portfolioId, portfoliosToDelete)
      )
    );

  // Delete extra portfolios (sections and contact_submissions cascade)
  await deletePortfolios(portfoliosToDelete);

  return {
    deleted: portfoliosToDelete.length,
    mediaReassigned,
  };
}

async function runMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    usersAffected: 0,
    portfoliosDeleted: 0,
    mediaReassigned: 0,
    errors: [],
  };

  console.log("Starting single-portfolio migration...\n");

  // Find affected users
  const usersWithMultiple = await findUsersWithMultiplePortfolios();
  console.log(`Found ${usersWithMultiple.length} users with multiple portfolios\n`);

  if (usersWithMultiple.length === 0) {
    console.log("No migration needed - all users already have single portfolio");
    return result;
  }

  // Process each user
  for (const userId of usersWithMultiple) {
    try {
      const { deleted, mediaReassigned } = await migrateUser(userId);
      result.usersAffected++;
      result.portfoliosDeleted += deleted;
      result.mediaReassigned += mediaReassigned;
    } catch (error) {
      const errorMsg = `Failed to migrate user ${userId}: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }
  }

  return result;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Single Portfolio Per User - Data Migration");
  console.log("=".repeat(60));
  console.log();

  try {
    const result = await runMigration();

    console.log("\n" + "=".repeat(60));
    console.log("Migration Complete");
    console.log("=".repeat(60));
    console.log(`Users affected: ${result.usersAffected}`);
    console.log(`Portfolios deleted: ${result.portfoliosDeleted}`);
    console.log(`Media reassigned: ${result.mediaReassigned}`);

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`);
      result.errors.forEach((e) => console.log(`  - ${e}`));
      process.exit(1);
    }

    console.log("\nNext step: Run 'npm run db:migrate' to apply the unique constraint");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
