import { z } from "zod";
import { readSubscrapeDraft, type SubscrapeDraft } from "./subscrape-draft";
import { PAY_TYPES, safeLink } from "./display";

export const SUBSCRAPE_SUBREDDITS = new Set(["ugccreators", "ugc_forhire", "ugcconnect", "ugc"]);

export { PAY_TYPES, PAY_LABELS, safeLink } from "./display";
const text = (max: number) => z.string().trim().min(1).max(max);
export const submissionSchema = z.object({
  contactEmail: z.email().max(254),
  applicationEmail: z.union([z.email().max(254), z.literal("")]).optional(),
  company: text(160), title: text(200), description: text(12_000),
  compensationType: z.enum(PAY_TYPES), compensationText: text(2000),
  cashAmount: z.number().positive().max(10_000_000).nullable(),
  deliverables: text(3000), eligibility: text(3000), usageRights: text(3000),
  applicationUrl: text(2000).refine(value => Boolean(safeLink(value)), "Use an HTTP or HTTPS application URL"),
  closingAt: z.iso.datetime(),
}).superRefine((row, ctx) => {
  if (row.compensationType === "unspecified") ctx.addIssue({ code: "custom", path: ["compensationType"], message: "Direct listings must state their compensation type" });
  if (new Date(row.closingAt).getTime() <= Date.now()) ctx.addIssue({ code: "custom", path: ["closingAt"], message: "Closing date must be in the future" });
  if (["cash", "mixed"].includes(row.compensationType) && row.cashAmount === null) ctx.addIssue({ code: "custom", path: ["cashAmount"], message: "Enter the guaranteed cash amount" });
});
export type Submission = z.infer<typeof submissionSchema>;
export interface BoardJob {
  application_email?: string | null; email_apply_enabled?: number;
  id: string; source_kind: "external" | "direct"; status: string; source_key: string | null; campaign_key: string | null;
  company: string; title: string; description: string; compensation_type: string; compensation_text: string; cash_amount: number | null;
  deliverables: string; eligibility: string; usage_rights: string; application_url: string; closing_at: string | null;
  source_url: string | null; source_published_at: string | null; captured_at: string | null; verified_at: string | null;
  submitter_email?: string;
  review_notes: string; created_at: string; updated_at: string; published_at: string | null;
}
export interface SourceSnapshot {
  key: string; revision: string; source: string; title: string; fullText: string; publishedAt: string | null;
  capturedAt: string; contentStatus: string; classification: string; compensationType: string; compensationText: string;
  jobBoard?: SubscrapeDraft | null;
}
const archive = z.object({
  type: z.literal("source"), source: z.string().max(2000), subreddit: z.string(), title: z.string().max(1000),
  fullText: z.string().max(1_000_000), publishedAt: z.string().nullable().optional(), capturedAt: z.iso.datetime(),
  contentStatus: z.enum(["available", "deleted", "removed"]).default("available"),
  classification: z.string().max(100).default("other"), compensationType: z.enum([...PAY_TYPES, "not_applicable"]).default("unspecified"),
  jobBoard: z.unknown().optional(), duplicateOf: z.string().max(2000).nullable().optional(),
  compensationEvidence: z.string().max(2000).default(""), included: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
});
export function sourceKey(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["www.reddit.com", "reddit.com", "old.reddit.com"].includes(url.hostname) || url.username || url.password || url.port) return null;
    const match = url.pathname.match(/^\/r\/([a-z0-9_]+)\/comments\/([a-z0-9]+)(?:\/[^/]+(?:\/([a-z0-9]+))?)?\/?$/i);
    return match && SUBSCRAPE_SUBREDDITS.has(match[1].toLowerCase()) ? `reddit:${match[2].toLowerCase()}:${match[3]?.toLowerCase() || "post"}` : null;
  } catch { return null; }
}
export async function normalizeSource(input: unknown): Promise<SourceSnapshot | null> {
  const result = archive.safeParse(input);
  if (!result.success) return null;
  const row = result.data, key = sourceKey(row.source);
  if (!key || !SUBSCRAPE_SUBREDDITS.has(row.subreddit.toLowerCase()) || new URL(row.source).pathname.split("/")[2]?.toLowerCase() !== row.subreddit.toLowerCase() || row.included === false || row.included === "false") return null;
  const publishedAt = row.publishedAt && z.iso.datetime().safeParse(row.publishedAt).success ? new Date(row.publishedAt).toISOString() : null;
  const compensationType = row.compensationType === "not_applicable" ? "unspecified" : row.compensationType;
  const jobBoard = readSubscrapeDraft(row.jobBoard, { key, source: row.source, publishedAt, classification: row.classification, compensationType });
  const classification = row.duplicateOf || jobBoard?.duplicateOf ? "duplicate_campaign_source" : row.classification;
  const revisionData = [row.title, row.fullText, publishedAt, row.contentStatus, classification, compensationType, row.compensationEvidence, jobBoard ? { ...jobBoard, capturedAt: undefined } : null];
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(revisionData)));
  const revision = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return { key, revision, source: row.source, title: row.title, fullText: row.fullText, publishedAt, capturedAt: new Date(row.capturedAt).toISOString(), contentStatus: row.contentStatus, classification, compensationType, compensationText: row.compensationEvidence, jobBoard };
}
export function qualifyingExternal(job: BoardJob, source: { full_text: string } | null, now: string) {
  return job.source_kind === "external" && job.status === "published" && ["cash", "mixed"].includes(job.compensation_type)
    && Number(job.cash_amount) > 0 && Boolean(source?.full_text && job.source_published_at && job.verified_at && job.campaign_key && safeLink(job.application_url))
    && (!job.closing_at || job.closing_at > now) && job.verified_at! >= new Date(new Date(now).getTime() - 7 * 86400_000).toISOString();
}
