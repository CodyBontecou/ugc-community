import type { D1Database } from "@/cloudflare-env";
import { sourceKey } from "./model";
export interface AuditLead { name: string; compensation_evidence: string; assessment: string; source: string; source_posted_at: string; open_status: string }
export async function seedAuditLeads(db: D1Database, leads: AuditLead[]) {
  const now = new Date().toISOString();
  for (const lead of leads) {
    const key = sourceKey(lead.source);
    if (!key) throw new Error("Invalid audit source");
    await db.prepare(`INSERT OR IGNORE INTO board_jobs
      (id, source_kind, source_key, company, title, description, compensation_text, source_url, review_notes, created_at, updated_at)
      VALUES (?, 'external', ?, ?, ?, 'Audit excerpt only; full brief and original posting date not captured.', ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), key, lead.name, `${lead.name} — unverified audit lead`, lead.compensation_evidence, lead.source,
        `${lead.assessment} Original date: ${lead.source_posted_at}. Availability: ${lead.open_status}. Do not treat parent thread date or capture date as the source date.`, now, now).run();
  }
}
