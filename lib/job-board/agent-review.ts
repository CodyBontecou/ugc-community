import { z } from "zod";
import type { D1Database } from "@/cloudflare-env";
import { safeLink } from "./model";
import { reviewSchema } from "./review-schema";
import { reviewJob } from "./store";

export const agentDecisionSchema = z.object({
  review: reviewSchema.extend({ action: z.enum(["publish", "reject", "close", "defer"]) }),
  checkedAt: z.iso.datetime(),
  evidence: z.array(z.object({
    url: z.string().max(2000).refine(value => Boolean(safeLink(value))),
    finding: z.string().trim().min(10).max(500),
  })).max(6),
});

// No submitter identifiers or emails are needed by the review agent.
export async function agentReviewQueue(db: D1Database) {
  const jobs = await db.prepare(`SELECT j.id, j.source_kind, j.status, j.source_key, j.campaign_key,
    j.company, j.title, j.description, j.compensation_type, j.compensation_text, j.cash_amount,
    j.deliverables, j.eligibility, j.usage_rights, j.application_url, j.closing_at,
    j.source_url, j.source_published_at, j.verified_at, j.updated_at, j.review_notes,
    s.full_text, s.revision, s.content_status, s.classification
    FROM board_jobs j LEFT JOIN board_sources s ON s.source_key=j.source_key
    WHERE j.status IN ('pending_review','published')
    ORDER BY j.verified_at ASC, j.created_at ASC LIMIT 100`).all();
  const campaigns = await db.prepare(`SELECT id, campaign_key, company, title, application_url, status
    FROM board_jobs WHERE campaign_key IS NOT NULL`).all();
  return { jobs: jobs.results, campaigns: campaigns.results, limit: 100 };
}

export async function applyAgentDecision(db: D1Database, raw: unknown) {
  const decision = agentDecisionSchema.parse(raw), input = decision.review;
  const checked = new Date(decision.checkedAt).getTime();
  if (checked > Date.now() + 60_000 || checked < Date.now() - 86400_000) throw new Error("Agent evidence must be checked within the last 24 hours");
  const job = await db.prepare("SELECT source_kind, source_url FROM board_jobs WHERE id=?")
    .bind(input.id).first<{ source_kind: string; source_url: string | null }>();
  if (!job) throw new Error("Listing not found");
  if (input.action === "publish") {
    const urls = new Set(decision.evidence.map(item => safeLink(item.url)));
    if (!urls.has(safeLink(input.applicationUrl)) || (job.source_kind === "external" && !urls.has(safeLink(job.source_url || "")))) {
      throw new Error("Agent publication requires fresh source and application destination evidence");
    }
    if (!decision.evidence.length) throw new Error("Agent publication requires evidence");
  }
  const notes = `[Daily agent review ${decision.checkedAt}] ${input.notes}\n${decision.evidence.map(item => `${item.url}: ${item.finding}`).join("\n")}`;
  if (notes.length > 3000) throw new Error("Agent review notes exceed 3000 characters");
  if (input.action === "defer") {
    const result = await db.prepare(`UPDATE board_jobs SET status='pending_review', verified_at=NULL,
      review_notes=?, updated_at=? WHERE id=? AND updated_at=?`)
      .bind(notes, new Date().toISOString(), input.id, input.expectedUpdatedAt).run();
    if (!result.meta.changes) throw new Error("Listing changed; reload before reviewing");
  } else {
    await reviewJob(db, { ...input, action: input.action, notes });
  }
}
