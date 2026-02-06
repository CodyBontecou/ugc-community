import { db } from "@/lib/db";
import { contentJobs } from "@/lib/db/schema";
import { eq, and, desc, sql, inArray, or, ilike } from "drizzle-orm";
import type { JobStatus, CompensationType, Platform } from "./constants";

export interface JobFilters {
  status?: JobStatus | JobStatus[];
  niches?: string[];
  platforms?: Platform[];
  compensationType?: CompensationType;
  search?: string;
}

export interface ListJobsOptions {
  filters?: JobFilters;
  limit?: number;
  offset?: number;
}

export async function listJobs(options: ListJobsOptions = {}) {
  const { filters = {}, limit = 20, offset = 0 } = options;

  // Build where conditions
  const conditions = [];

  // Status filter
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(inArray(contentJobs.status, filters.status));
    } else {
      conditions.push(eq(contentJobs.status, filters.status));
    }
  }

  // Niche filter - check if any of the job's niches overlap with the filter
  if (filters.niches && filters.niches.length > 0) {
    conditions.push(
      sql`${contentJobs.niches} && ${sql.raw(`ARRAY[${filters.niches.map(n => `'${n}'`).join(",")}]::text[]`)}`
    );
  }

  // Platform filter
  if (filters.platforms && filters.platforms.length > 0) {
    conditions.push(
      sql`${contentJobs.platforms} && ${sql.raw(`ARRAY[${filters.platforms.map(p => `'${p}'`).join(",")}]::text[]`)}`
    );
  }

  // Compensation type filter
  if (filters.compensationType) {
    conditions.push(eq(contentJobs.compensationType, filters.compensationType));
  }

  // Search filter
  if (filters.search) {
    conditions.push(
      or(
        ilike(contentJobs.title, `%${filters.search}%`),
        ilike(contentJobs.description, `%${filters.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get jobs
  const jobs = await db
    .select({
      id: contentJobs.id,
      title: contentJobs.title,
      description: contentJobs.description,
      hooks: contentJobs.hooks,
      compensationType: contentJobs.compensationType,
      compensationDetails: contentJobs.compensationDetails,
      niches: contentJobs.niches,
      platforms: contentJobs.platforms,
      status: contentJobs.status,
      createdBy: contentJobs.createdBy,
      brandId: contentJobs.brandId,
      isFeatured: contentJobs.isFeatured,
      deadlineAt: contentJobs.deadlineAt,
      viewCount: contentJobs.viewCount,
      createdAt: contentJobs.createdAt,
      updatedAt: contentJobs.updatedAt,
      publishedAt: contentJobs.publishedAt,
    })
    .from(contentJobs)
    .where(whereClause)
    .orderBy(desc(contentJobs.isFeatured), desc(contentJobs.publishedAt), desc(contentJobs.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentJobs)
    .where(whereClause);
  const total = countResult[0]?.count || 0;

  return {
    jobs,
    total,
    limit,
    offset,
  };
}

export async function getJobById(jobId: string) {
  const job = await db
    .select({
      id: contentJobs.id,
      title: contentJobs.title,
      description: contentJobs.description,
      hooks: contentJobs.hooks,
      compensationType: contentJobs.compensationType,
      compensationDetails: contentJobs.compensationDetails,
      niches: contentJobs.niches,
      platforms: contentJobs.platforms,
      status: contentJobs.status,
      createdBy: contentJobs.createdBy,
      brandId: contentJobs.brandId,
      isFeatured: contentJobs.isFeatured,
      deadlineAt: contentJobs.deadlineAt,
      viewCount: contentJobs.viewCount,
      createdAt: contentJobs.createdAt,
      updatedAt: contentJobs.updatedAt,
      publishedAt: contentJobs.publishedAt,
    })
    .from(contentJobs)
    .where(eq(contentJobs.id, jobId))
    .limit(1);

  if (!job[0]) return null;

  return { job: job[0] };
}

export async function incrementJobViewCount(jobId: string) {
  await db
    .update(contentJobs)
    .set({ viewCount: sql`${contentJobs.viewCount} + 1` })
    .where(eq(contentJobs.id, jobId));
}

// Admin functions
export async function createJob(data: {
  title: string;
  description: string;
  hooks?: string[];
  compensationType: string;
  compensationDetails?: string;
  niches?: string[];
  platforms?: string[];
  status?: string;
  createdBy: string;
  brandId?: string;
  isFeatured?: boolean;
  deadlineAt?: Date;
}) {
  const result = await db
    .insert(contentJobs)
    .values({
      title: data.title,
      description: data.description,
      hooks: data.hooks || [],
      compensationType: data.compensationType,
      compensationDetails: data.compensationDetails,
      niches: data.niches || [],
      platforms: data.platforms || [],
      status: data.status || "draft",
      createdBy: data.createdBy,
      brandId: data.brandId,
      isFeatured: data.isFeatured || false,
      deadlineAt: data.deadlineAt,
      publishedAt: data.status === "active" ? new Date() : undefined,
    })
    .returning();

  return result[0];
}

export async function updateJob(
  jobId: string,
  data: Partial<{
    title: string;
    description: string;
    hooks: string[];
    compensationType: string;
    compensationDetails: string;
    niches: string[];
    platforms: string[];
    status: string;
    brandId: string | null;
    isFeatured: boolean;
    deadlineAt: Date | null;
  }>
) {
  // If status is being changed to active and wasn't before, set publishedAt
  let publishedAt: Date | undefined;
  if (data.status === "active") {
    const existing = await db
      .select({ status: contentJobs.status, publishedAt: contentJobs.publishedAt })
      .from(contentJobs)
      .where(eq(contentJobs.id, jobId))
      .limit(1);

    if (existing[0] && existing[0].status !== "active" && !existing[0].publishedAt) {
      publishedAt = new Date();
    }
  }

  const result = await db
    .update(contentJobs)
    .set({
      ...data,
      ...(publishedAt ? { publishedAt } : {}),
      updatedAt: new Date(),
    })
    .where(eq(contentJobs.id, jobId))
    .returning();

  return result[0];
}

export async function deleteJob(jobId: string) {
  await db.delete(contentJobs).where(eq(contentJobs.id, jobId));
}

// Brand-specific functions

export async function countBrandActiveJobs(brandId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentJobs)
    .where(
      and(
        eq(contentJobs.brandId, brandId),
        inArray(contentJobs.status, ["draft", "pending_review", "active", "paused"])
      )
    );
  return result[0]?.count || 0;
}

export interface ListBrandJobsOptions {
  status?: JobStatus | JobStatus[];
  limit?: number;
  offset?: number;
}

export async function listBrandJobs(brandId: string, options: ListBrandJobsOptions = {}) {
  const { status, limit = 20, offset = 0 } = options;

  const conditions = [eq(contentJobs.brandId, brandId)];

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray(contentJobs.status, status));
    } else {
      conditions.push(eq(contentJobs.status, status));
    }
  }

  const jobs = await db
    .select({
      id: contentJobs.id,
      title: contentJobs.title,
      description: contentJobs.description,
      hooks: contentJobs.hooks,
      compensationType: contentJobs.compensationType,
      compensationDetails: contentJobs.compensationDetails,
      niches: contentJobs.niches,
      platforms: contentJobs.platforms,
      status: contentJobs.status,
      createdBy: contentJobs.createdBy,
      brandId: contentJobs.brandId,
      isFeatured: contentJobs.isFeatured,
      deadlineAt: contentJobs.deadlineAt,
      viewCount: contentJobs.viewCount,
      createdAt: contentJobs.createdAt,
      updatedAt: contentJobs.updatedAt,
      publishedAt: contentJobs.publishedAt,
    })
    .from(contentJobs)
    .where(and(...conditions))
    .orderBy(desc(contentJobs.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentJobs)
    .where(and(...conditions));
  const total = countResult[0]?.count || 0;

  return {
    jobs,
    total,
    limit,
    offset,
  };
}

export async function getBrandJobById(jobId: string, brandId: string) {
  const job = await db
    .select({
      id: contentJobs.id,
      title: contentJobs.title,
      description: contentJobs.description,
      hooks: contentJobs.hooks,
      compensationType: contentJobs.compensationType,
      compensationDetails: contentJobs.compensationDetails,
      niches: contentJobs.niches,
      platforms: contentJobs.platforms,
      status: contentJobs.status,
      createdBy: contentJobs.createdBy,
      brandId: contentJobs.brandId,
      isFeatured: contentJobs.isFeatured,
      deadlineAt: contentJobs.deadlineAt,
      viewCount: contentJobs.viewCount,
      createdAt: contentJobs.createdAt,
      updatedAt: contentJobs.updatedAt,
      publishedAt: contentJobs.publishedAt,
    })
    .from(contentJobs)
    .where(and(eq(contentJobs.id, jobId), eq(contentJobs.brandId, brandId)))
    .limit(1);

  if (!job[0]) return null;

  return { job: job[0] };
}


