import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { list } from "@vercel/blob";

// Aggregate, read-only inventory. Never output credentials, user identifiers or file URLs.
const report: Record<string, unknown> = { checkedAt: new Date().toISOString() };
const legacyTables = ["onboarding_questionnaires", "portfolio_generations", "media", "posts", "hashtag_mentions", "milestones", "user_milestones", "saved_creators", "content_jobs", "job_hooks"];
if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const existing = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    const names = new Set(existing.map(row => row.table_name));
    const counts: Record<string, unknown> = {};
    for (const table of legacyTables) {
      counts[table] = names.has(table) ? (await sql(`SELECT COUNT(*)::text AS count FROM "${table}"`))[0].count : "absent";
    }
    report.database = { available: true, counts, generationStates: names.has("portfolio_generations")
      ? await sql`SELECT status, COUNT(*)::text AS count FROM portfolio_generations GROUP BY status` : [] };
  } catch {
    report.database = { available: false, reason: "Read failed; check database access. No raw connection error is printed because it may contain credentials." };
    process.exitCode = 1;
  }
} else report.database = { available: false, reason: "DATABASE_URL not available in this shell." };

if (process.env.BLOB_READ_WRITE_TOKEN) {
  try {
    let cursor: string | undefined, objects = 0, bytes = 0;
    const portfolios = new Set<string>();
    do {
      const page = await list({ prefix: "portfolios/", cursor, limit: 1000 });
      for (const blob of page.blobs) {
        objects++; bytes += blob.size;
        portfolios.add(blob.pathname.split("/")[1]);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    report.portfolioStorage = { available: true, portfolios: portfolios.size, objects, bytes };
  } catch {
    report.portfolioStorage = { available: false, reason: "Read failed; check Blob storage access." };
    process.exitCode = 1;
  }
} else report.portfolioStorage = { available: false, reason: "BLOB_READ_WRITE_TOKEN not available in this shell." };
console.log(JSON.stringify(report, null, 2));
