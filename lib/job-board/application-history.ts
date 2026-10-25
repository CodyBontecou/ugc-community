import type { D1Database } from "@/cloudflare-env";

export type ApplicationHistoryEntry = {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  status: string;
  failure_retryable: number;
  created_at: string;
};

export async function listCreatorApplications(db: D1Database, userId: string) {
  const result = await db.prepare(`SELECT id, job_id, job_title, company, status, failure_retryable, created_at
    FROM board_applications WHERE user_id=? ORDER BY created_at DESC LIMIT 50`)
    .bind(userId).all<ApplicationHistoryEntry>();
  if (!result.success) throw new Error("Could not load application history");
  return result.results;
}

export function applicationStatusLabel(application: Pick<ApplicationHistoryEntry, "status" | "failure_retryable">) {
  if (application.status === "sent") return "Sent to email provider";
  if (application.status === "failed" && application.failure_retryable) return "Email rejected — open to retry";
  return "Send status needs checking";
}
