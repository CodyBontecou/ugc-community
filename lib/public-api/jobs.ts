import { z } from "zod";
import type { D1Database } from "@/cloudflare-env";
import { listBoardJobs, PUBLIC_FIELDS, VISIBLE, visibleBindings } from "@/lib/job-board/search";
import { PAY_TYPES, safeLink, type BoardJob } from "@/lib/job-board/model";

export const searchSchema = z.object({
  q: z.string().max(100).default("").describe("Search company, title, or description; up to 100 characters."),
  source: z.enum(["", "external", "direct"]).default("").describe("Filter external opportunities or directly posted jobs; empty means both."),
  pay: z.enum(["", ...PAY_TYPES]).default("").describe("Compensation category; empty includes all categories."),
  page: z.number().int().min(1).max(10000).default(1).describe("One-based page number, with 20 results per page."),
}).strict();
export const jobSchema = z.object({
  id: z.string(), url: z.string().url(), source: z.enum(["external", "direct"]), company: z.string(), title: z.string(), description: z.string(),
  compensation: z.object({ type: z.enum(PAY_TYPES), text: z.string(), cashAmount: z.number().nullable() }),
  deliverables: z.string(), eligibility: z.string(), usageRights: z.string(),
  applicationUrl: z.string().nullable(), sourceUrl: z.string().nullable(),
  closingAt: z.string().nullable(), sourcePublishedAt: z.string().nullable(), verifiedAt: z.string().nullable(), publishedAt: z.string().nullable(),
});
export const jobsResultSchema = z.object({ jobs: z.array(jobSchema), total: z.number().int(), page: z.number().int(), pageSize: z.literal(20), next: z.string().nullable() });
export type SearchInput = z.infer<typeof searchSchema>;

// Explicit projection keeps submitter emails, review notes, and future private
// columns out of the REST, MCP, and CLI contracts, even if the row grows.
export function publicJob(row: BoardJob): z.infer<typeof jobSchema> {
  return jobSchema.parse({
    id: row.id, url: `https://ugc.community/jobs/${encodeURIComponent(row.id)}`, source: row.source_kind, company: row.company, title: row.title, description: row.description,
    compensation: { type: row.compensation_type, text: row.compensation_text, cashAmount: row.cash_amount },
    deliverables: row.deliverables, eligibility: row.eligibility, usageRights: row.usage_rights,
    applicationUrl: safeLink(row.application_url), sourceUrl: row.source_url ? safeLink(row.source_url) : null,
    closingAt: row.closing_at, sourcePublishedAt: row.source_published_at, verifiedAt: row.verified_at, publishedAt: row.published_at,
  });
}

export async function searchPublicJobs(db: D1Database, input: SearchInput) {
  const result = await listBoardJobs(db, input);
  const next = new URL("https://ugc.community/api/v1/jobs");
  for (const key of ["q", "source", "pay"] as const) if (input[key]) next.searchParams.set(key, input[key]);
  next.searchParams.set("page", String(result.page + 1));
  return { jobs: result.jobs.map(publicJob), total: result.total, page: result.page, pageSize: 20 as const, next: result.page * result.pageSize < result.total ? next.href : null };
}

export async function getPublicJob(db: D1Database, id: string) {
  const now = new Date().toISOString();
  const row = await db.prepare(`SELECT ${PUBLIC_FIELDS} FROM board_jobs WHERE id=? AND ${VISIBLE}`).bind(id, ...visibleBindings(now)).first<BoardJob>();
  return row ? publicJob(row) : null;
}
