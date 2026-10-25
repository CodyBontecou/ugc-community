import { z } from "zod";
import type { D1Database } from "@/cloudflare-env";
import { VISIBLE, visibleBindings } from "./search";
import { getCreatorProfile, type CreatorProfile } from "./profiles";
export const applicationSchema = z.object({
  message: z.string().trim().min(20, "Add a short message explaining your fit (at least 20 characters)").max(3000),
  consent: z.literal(true, { error: "Confirm that you want to share your profile and email with this employer" }),
});
export interface Application {
  id: string; job_id: string; user_id: string; recipient: string; reply_email: string;
  job_title: string; company: string; profile_json: string; message: string;
  status: "pending" | "sending" | "sent" | "failed"; created_at: string; lease_until: string | null; provider_id: string | null;
}
export class ApplicationError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type ApplicationSender = (application: Application, profile: CreatorProfile) => Promise<string>;
export async function submitApplication(db: D1Database, user: { id: string; email: string; emailVerified: boolean }, jobId: string, raw: unknown, send: ApplicationSender) {
  if (!user.emailVerified) throw new ApplicationError("Verify your email before applying", 403);
  const input = applicationSchema.parse(raw);
  const now = new Date().toISOString();
  const job = await db.prepare(`SELECT id, title, company, application_email FROM board_jobs WHERE id=? AND ${VISIBLE}`)
    .bind(jobId, ...visibleBindings(now)).first<{ id: string; title: string; company: string; application_email: string | null }>();
  if (!job?.application_email) throw new ApplicationError("This job does not accept email applications or is no longer open", 409);
  const saved = await getCreatorProfile(db, user.id);
  if (!saved) throw new ApplicationError("Save your creator profile before applying");
  // One immutable snapshot per applicant and job. A retry reuses both payload and provider key.
  await db.prepare(`INSERT OR IGNORE INTO board_applications
    (id, job_id, user_id, recipient, reply_email, job_title, company, profile_json, message, status, created_at)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?
    WHERE (SELECT COUNT(*) FROM board_applications WHERE user_id=? AND created_at>=?) < 10`)
    .bind(crypto.randomUUID(), jobId, user.id, job.application_email, user.email, job.title, job.company,
      JSON.stringify(saved.profile), input.message, now, user.id, new Date(Date.now() - 86400_000).toISOString()).run();
  const application = await db.prepare("SELECT * FROM board_applications WHERE job_id=? AND user_id=?").bind(jobId, user.id).first<Application>();
  if (!application) throw new ApplicationError("You have reached the daily limit of 10 applications", 429);
  if (application.status === "sent") return application;
  // Resend retains idempotency keys for 24 hours. Stop before that window expires;
  // an uncertain old send needs reconciliation rather than risking a duplicate email.
  if (Date.now() - Date.parse(application.created_at) > 23 * 3600_000) {
    throw new ApplicationError("This application's send status needs checking. Please contact support before retrying.", 409);
  }
  if (application.recipient !== job.application_email) throw new ApplicationError("The application destination changed. Please contact support before retrying.", 409);
  const lease = new Date(Date.now() + 120_000).toISOString();
  const claimed = await db.prepare(`UPDATE board_applications SET status='sending', lease_until=?
    WHERE id=? AND status<>'sent' AND (lease_until IS NULL OR lease_until<?)`)
    .bind(lease, application.id, now).run();
  if (!claimed.meta.changes) throw new ApplicationError("Your application is being sent. Check again in a moment.", 409);
  let providerId: string;
  try { providerId = await send(application, JSON.parse(application.profile_json)); }
  catch {
    await db.prepare("UPDATE board_applications SET status='failed', lease_until=NULL WHERE id=? AND lease_until=?")
      .bind(application.id, lease).run();
    throw new ApplicationError("Sending could not be confirmed. Retry to safely check or resend your saved application.", 503);
  }
  await db.prepare("UPDATE board_applications SET status='sent', provider_id=?, lease_until=NULL WHERE id=? AND lease_until=?")
    .bind(providerId, application.id, lease).run();
  return { ...application, status: "sent" as const, provider_id: providerId };
}
