import type { D1Database } from "@/cloudflare-env";
import { safeLink, submissionSchema, type BoardJob, type Submission, type SourceSnapshot } from "./model";

export async function storeSource(db: D1Database, row: SourceSnapshot) {
  return storeSources(db, [row]);
}
export async function storeSources(db: D1Database, rows: SourceSnapshot[]) {
  for (let offset = 0; offset < rows.length; offset += 20) {
    const chunk = rows.slice(offset, offset + 20);
    const existing = await db.prepare(`SELECT source_key, revision, captured_at FROM board_sources WHERE source_key IN (${chunk.map(() => "?").join(",")})`)
      .bind(...chunk.map(row => row.key)).all<{ source_key: string; revision: string; captured_at: string }>();
    const byKey = new Map(existing.results.map(row => [row.source_key, row]));
    const statements = [];
    for (const row of chunk) {
      const previous = byKey.get(row.key);
      if (previous && previous.captured_at > row.capturedAt) continue;
      if (previous?.revision === row.revision) {
        statements.push(db.prepare("UPDATE board_sources SET captured_at=MAX(captured_at, ?) WHERE source_key=?").bind(row.capturedAt, row.key));
        continue;
      }
      const now = new Date().toISOString();
      const candidate = ["paid_ugc_job", "hiring_unconfirmed"].includes(row.classification) && row.contentStatus === "available";
      const pending = [
        db.prepare(`INSERT INTO board_sources VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(source_key) DO UPDATE SET revision=excluded.revision, source_url=excluded.source_url,
          title=excluded.title, full_text=excluded.full_text, published_at=excluded.published_at, captured_at=excluded.captured_at,
          content_status=excluded.content_status, classification=excluded.classification`)
          .bind(row.key, row.revision, row.source, row.title, row.fullText, row.publishedAt, row.capturedAt, row.contentStatus, row.classification),
        db.prepare("INSERT OR IGNORE INTO board_observations VALUES (?, ?, ?, ?, ?, ?)")
          .bind(row.key, row.revision, now, row.publishedAt, row.fullText.trim() ? 1 : 0, candidate ? 1 : 0),
      ];
      if (candidate) {
        pending.push(db.prepare(`INSERT INTO board_jobs
          (id, source_kind, source_key, company, title, description, compensation_type, compensation_text, source_url, source_published_at, captured_at, created_at, updated_at)
          VALUES (?, 'external', ?, 'Employer needs review', ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(source_key) DO UPDATE SET status='pending_review', description=excluded.description,
            source_published_at=excluded.source_published_at, captured_at=excluded.captured_at,
            source_url=excluded.source_url, verified_at=NULL, updated_at=excluded.updated_at`)
          .bind(crypto.randomUUID(), row.key, row.title || "UGC opportunity — review required", "Source captured; write a short summary after reviewing the original brief.", row.compensationType, row.compensationText, row.source, row.publishedAt, row.capturedAt, now, now));
      } else {
        // A removed source or a revision without a hiring signal can never remain public.
        pending.push(db.prepare("UPDATE board_jobs SET status=?, verified_at=NULL, updated_at=? WHERE source_key=?")
          .bind(row.contentStatus === "available" ? "pending_review" : "closed", now, row.key));
      }
      statements.push(...pending);
    }
    if (statements.length) await db.batch(statements);
  }
}

export async function submitDirectJob(db: D1Database, input: Submission, user: { id: string; email: string }) {
  const data = submissionSchema.parse(input);
  const id = crypto.randomUUID(), now = new Date().toISOString();
  // The server supplies an account ID or salted network hash for the daily cap.
  // Submissions never publish themselves.
  const saved = await db.prepare(`INSERT INTO board_jobs
    (id, source_kind, company, title, description, compensation_type, compensation_text, cash_amount, deliverables, eligibility,
      usage_rights, application_url, closing_at, submitter_user_id, submitter_email, created_at, updated_at)
    SELECT ?, 'direct', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (SELECT COUNT(*) FROM board_jobs WHERE submitter_user_id=? AND created_at>=?) < 5`)
    .bind(id, data.company, data.title, data.description, data.compensationType, data.compensationText, data.cashAmount, data.deliverables,
      data.eligibility, data.usageRights, data.applicationUrl, data.closingAt, user.id, user.email, now, now, user.id, new Date(Date.now() - 86400_000).toISOString()).run();
  if (!saved.meta.changes) throw new Error("Daily submission limit reached");
  return id;
}

export interface ReviewInput {
  id: string; expectedUpdatedAt: string; action: "publish" | "reject" | "close";
  company: string; title: string; description: string; compensationType: string; compensationText: string; cashAmount: number | null;
  deliverables: string; eligibility: string; usageRights: string; applicationUrl: string; closingAt: string | null;
  campaignKey: string; notes: string; verified: boolean;
}
export async function reviewJob(db: D1Database, input: ReviewInput, evidence: { sourceCapturedAt?: string } = {}) {
  const job = await db.prepare("SELECT * FROM board_jobs WHERE id=?").bind(input.id).first<BoardJob>();
  if (!job) throw new Error("Listing not found");
  if (job.updated_at !== input.expectedUpdatedAt) throw new Error("Listing changed; reload before reviewing");
  const now = new Date().toISOString();
  // An archive review cannot extend freshness beyond the evidence's capture date.
  const verifiedAt = evidence.sourceCapturedAt || now;
  if (input.action === "publish") {
    if (!input.verified || !input.company.trim() || !input.title.trim() || !input.compensationText.trim() || !safeLink(input.applicationUrl) || input.campaignKey.trim().length < 3) throw new Error("Confirm the application destination, employer, terms, and campaign identifier");
    if (input.closingAt && input.closingAt <= now) throw new Error("Closing date must be in the future");
    if (["cash", "mixed"].includes(input.compensationType) && !(Number(input.cashAmount) > 0)) throw new Error("Cash compensation requires an explicit guaranteed amount");
    if (job.source_kind === "direct" && (input.compensationType === "unspecified" || !input.deliverables.trim() || !input.eligibility.trim() || !input.usageRights.trim() || !input.closingAt)) throw new Error("Direct listings require compensation, deliverables, eligibility, usage rights, and a closing date");
    if (job.source_kind === "external") {
      if (input.description.trim().length < 20 || input.description.length > 1000) throw new Error("External listings require a short reviewed summary (20–1000 characters)");
      const source = await db.prepare("SELECT full_text, content_status, published_at FROM board_sources WHERE source_key=?").bind(job.source_key).first<{ full_text: string; content_status: string; published_at: string | null }>();
      if (!source?.full_text.trim() || source.content_status !== "available" || !source.published_at || source.published_at > now) throw new Error("Full source text and an original posting date are required before publishing");
    }
    const duplicate = await db.prepare("SELECT id FROM board_jobs WHERE campaign_key=? AND id<>?").bind(input.campaignKey.trim().toLowerCase(), job.id).first();
    if (duplicate) throw new Error("Campaign already exists; reject this duplicate or update its existing listing");
  }
  const status = input.action === "publish" ? "published" : input.action === "reject" ? "rejected" : "closed";
  const update = db.prepare(`UPDATE board_jobs SET status=?, company=?, title=?, description=?, compensation_type=?, compensation_text=?, cash_amount=?,
    deliverables=?, eligibility=?, usage_rights=?, application_url=?, closing_at=?, campaign_key=?, review_notes=?, verified_at=?,
    published_at=CASE WHEN ?='published' THEN COALESCE(published_at, ?) ELSE published_at END, updated_at=? WHERE id=? AND updated_at=?`)
    .bind(status, input.company, input.title, input.description, input.compensationType, input.compensationText, input.cashAmount, input.deliverables,
      input.eligibility, input.usageRights, input.applicationUrl, input.closingAt,
      input.action === "publish" ? input.campaignKey.trim().toLowerCase() : job.campaign_key, input.notes,
      input.action === "publish" ? verifiedAt : null, status, now, now, job.id, input.expectedUpdatedAt);
  const qualifications = input.action === "publish" ? db.prepare(`
    INSERT INTO board_qualifications (campaign_key, job_id, qualified_at, first_seen_at, source_published_at)
    SELECT j.campaign_key, j.id, ?, MIN(o.first_seen_at), j.source_published_at
    FROM board_jobs j JOIN board_sources s ON s.source_key=j.source_key JOIN board_observations o ON o.source_key=j.source_key
    JOIN board_validation_window w ON w.id=1
    WHERE j.id=? AND j.updated_at=? AND j.source_kind='external' AND j.status='published'
      AND j.compensation_type IN ('cash','mixed') AND j.cash_amount>0 AND length(trim(s.full_text))>0
      AND j.source_published_at>=w.starts_at AND j.source_published_at<w.ends_at
    GROUP BY j.id HAVING MIN(o.first_seen_at)>=w.starts_at AND MIN(o.first_seen_at)<w.ends_at
    ON CONFLICT(campaign_key) DO UPDATE SET invalidated_at=NULL
  `).bind(now, job.id, now) : db.prepare("UPDATE board_qualifications SET invalidated_at=? WHERE job_id=? AND ?='reject' AND EXISTS (SELECT 1 FROM board_jobs WHERE id=? AND updated_at=?)").bind(now, job.id, input.action, job.id, now);
  const invalidate = db.prepare(`UPDATE board_qualifications SET invalidated_at=? WHERE job_id=? AND ?='publish'
    AND EXISTS (SELECT 1 FROM board_jobs WHERE id=? AND updated_at=?)
    AND NOT EXISTS (SELECT 1 FROM board_jobs j JOIN board_sources s ON s.source_key=j.source_key
      WHERE j.id=? AND j.updated_at=? AND j.compensation_type IN ('cash','mixed') AND j.cash_amount>0
        AND j.campaign_key=board_qualifications.campaign_key AND length(trim(s.full_text))>0)`)
    .bind(now, job.id, input.action, job.id, now, job.id, now);
  const [result] = await db.batch([update, invalidate, qualifications]);
  if (!result.meta.changes) throw new Error("Listing changed; reload before reviewing");
}
