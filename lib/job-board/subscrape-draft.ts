import { z } from "zod";
import type { D1Database } from "@/cloudflare-env";
import type { SourceSnapshot } from "./model";

const nullableText = (max: number) => z.string().max(max).nullable();
export const subscrapeDraftSchema = z.object({
  schemaVersion: z.literal(1), sourceKey: z.string().min(1).max(200), sourceKind: z.literal("external"),
  status: z.literal("pending_review"), verified: z.literal(false),
  campaignKey: z.string().min(1).max(200), sourceKeys: z.array(z.string().max(200)).min(1).max(1000), duplicateOf: nullableText(200),
  classification: z.string().max(100), company: nullableText(160), title: z.string().max(200), description: z.string().max(1000),
  compensationType: z.enum(["cash","mixed","performance_only","affiliate","gifted_or_unpaid","unspecified"]),
  compensationText: z.string().max(2000), cashAmount: z.number().positive().max(10_000_000).nullable(),
  deliverables: z.string().max(3000), eligibility: z.string().max(3000), usageRights: z.string().max(3000),
  applicationUrl: nullableText(2000), applicationMethod: z.enum(["form","website","email","reddit_dm","reddit_comment","unknown"]),
  closingAt: z.iso.datetime().nullable(), closingText: z.string().max(500), sourceUrl: z.string().max(2000),
  sourcePublishedAt: z.iso.datetime().nullable(), capturedAt: z.iso.datetime().nullable(),
  reviewFlags: z.array(z.string().max(100)).max(30),
});
export type SubscrapeDraft = z.infer<typeof subscrapeDraftSchema>;
export function readSubscrapeDraft(input: unknown, source: { key: string; source: string; publishedAt: string | null; classification: string; compensationType: string }) {
  if (typeof input === "string") { try { input = JSON.parse(input); } catch { return null; } }
  const parsed = subscrapeDraftSchema.safeParse(input);
  if (!parsed.success) return null;
  const row = parsed.data;
  if (row.sourceKey !== source.key || row.sourceUrl !== source.source || row.sourcePublishedAt !== source.publishedAt
    || row.classification !== source.classification || row.compensationType !== source.compensationType || !row.sourceKeys.includes(row.sourceKey)
    || (row.duplicateOf && (!row.sourceKeys.includes(row.duplicateOf) || row.duplicateOf === row.sourceKey))) return null;
  if (row.applicationUrl) { try { const u = new URL(row.applicationUrl); if (!["https:","http:"].includes(u.protocol) || u.username || u.password) return null; } catch { return null; } }
  return row;
}

// Drafts prefill private candidates only. They cannot grant verification or publish.
// No schema migration is required: these match the board's existing review columns.
export async function prefillSourceDrafts(db: D1Database, sources: SourceSnapshot[]) {
  for (let offset = 0; offset < sources.length; offset += 20) {
    const statements = sources.slice(offset, offset + 20).flatMap(source => {
      const draft = source.jobBoard;
      if (source.contentStatus !== "available") return [];
      if (source.classification === "duplicate_campaign_source") return [db.prepare(`UPDATE board_jobs SET status='rejected', verified_at=NULL, updated_at=?,
        review_notes=? WHERE source_key=? AND status='pending_review'
        AND EXISTS (SELECT 1 FROM board_sources WHERE source_key=? AND revision=?)`)
        .bind(new Date().toISOString(), `Subscrape duplicate source${draft ? ` of ${draft.duplicateOf}; campaign ${draft.campaignKey}` : ""}`, source.key, source.key, source.revision)];
      if (!draft || !["paid_ugc_job","hiring_unconfirmed"].includes(source.classification)) return [];
      let notes = JSON.stringify({ subscrapeSchemaVersion: 1, suggestedCampaignKey: draft.campaignKey,
        sourceKeys: draft.sourceKeys, reviewFlags: draft.reviewFlags, applicationMethod: draft.applicationMethod,
        closingText: draft.closingText });
      if (notes.length > 3000) notes = JSON.stringify({ suggestedCampaignKey: draft.campaignKey, sourceKeyCount: draft.sourceKeys.length, reviewFlags: ["additional_metadata_in_source_export"] });
      return [db.prepare(`UPDATE board_jobs SET company=?, title=?, description=?, compensation_type=?, compensation_text=?, cash_amount=?,
        deliverables=?, eligibility=?, usage_rights=?, application_url=?, closing_at=?, review_notes=?
        WHERE source_key=? AND status='pending_review' AND EXISTS
        (SELECT 1 FROM board_sources WHERE source_key=? AND revision=? AND captured_at=?)`)
        .bind(draft.company || "Employer needs review", draft.title || source.title, draft.description, draft.compensationType,
          draft.compensationText, draft.cashAmount, draft.deliverables, draft.eligibility, draft.usageRights,
          draft.applicationUrl || "", draft.closingAt, notes, source.key, source.key, source.revision, source.capturedAt)];
    });
    if (statements.length) await db.batch(statements);
  }
}
