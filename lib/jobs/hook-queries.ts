import { db } from "@/lib/db";
import { jobHooks } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export interface JobHookRow {
  id: string;
  jobId: string;
  hookText: string;
  screenshotUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * List all hooks for a job, ordered by sortOrder
 */
export async function listJobHooks(jobId: string): Promise<JobHookRow[]> {
  return db
    .select()
    .from(jobHooks)
    .where(eq(jobHooks.jobId, jobId))
    .orderBy(asc(jobHooks.sortOrder), asc(jobHooks.createdAt));
}

/**
 * Get a single hook by ID
 */
export async function getJobHook(hookId: string): Promise<JobHookRow | null> {
  const rows = await db
    .select()
    .from(jobHooks)
    .where(eq(jobHooks.id, hookId))
    .limit(1);
  return rows[0] || null;
}

/**
 * Create a single hook for a job
 */
export async function createJobHook(data: {
  jobId: string;
  hookText: string;
  screenshotUrl?: string | null;
  sortOrder?: number;
}): Promise<JobHookRow> {
  // If no sortOrder provided, put it at the end
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    const maxResult = await db
      .select({ max: sql<number>`coalesce(max(${jobHooks.sortOrder}), -1)` })
      .from(jobHooks)
      .where(eq(jobHooks.jobId, data.jobId));
    sortOrder = (maxResult[0]?.max ?? -1) + 1;
  }

  const [hook] = await db
    .insert(jobHooks)
    .values({
      jobId: data.jobId,
      hookText: data.hookText,
      screenshotUrl: data.screenshotUrl || null,
      sortOrder,
    })
    .returning();

  return hook;
}

/**
 * Update a hook
 */
export async function updateJobHook(
  hookId: string,
  data: Partial<{
    hookText: string;
    screenshotUrl: string | null;
    sortOrder: number;
  }>
): Promise<JobHookRow | null> {
  const [hook] = await db
    .update(jobHooks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(jobHooks.id, hookId))
    .returning();

  return hook || null;
}

/**
 * Delete a hook
 */
export async function deleteJobHook(hookId: string): Promise<void> {
  await db.delete(jobHooks).where(eq(jobHooks.id, hookId));
}

/**
 * Bulk-insert hooks (used for CSV import)
 * Clears existing hooks for the job first if `replace` is true
 */
export async function bulkInsertJobHooks(
  jobId: string,
  rows: { hookText: string; screenshotUrl?: string | null }[],
  replace = false
): Promise<JobHookRow[]> {
  if (replace) {
    await db.delete(jobHooks).where(eq(jobHooks.jobId, jobId));
  }

  if (rows.length === 0) return [];

  // Get current max sort order if not replacing
  let startOrder = 0;
  if (!replace) {
    const maxResult = await db
      .select({ max: sql<number>`coalesce(max(${jobHooks.sortOrder}), -1)` })
      .from(jobHooks)
      .where(eq(jobHooks.jobId, jobId));
    startOrder = (maxResult[0]?.max ?? -1) + 1;
  }

  const values = rows.map((row, i) => ({
    jobId,
    hookText: row.hookText,
    screenshotUrl: row.screenshotUrl || null,
    sortOrder: startOrder + i,
  }));

  return db.insert(jobHooks).values(values).returning();
}
