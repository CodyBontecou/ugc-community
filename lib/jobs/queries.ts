import { db } from "@/lib/db";
import { contentJobs, jobApplications, users } from "@/lib/db/schema";
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
  includeApplicationCount?: boolean;
  creatorId?: string; // To check if creator has applied
}

export async function listJobs(options: ListJobsOptions = {}) {
  const { filters = {}, limit = 20, offset = 0, includeApplicationCount = false, creatorId } = options;

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

  // Optionally get application counts
  let jobsWithCounts = jobs;
  if (includeApplicationCount && jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id);
    const applicationCounts = await db
      .select({
        jobId: jobApplications.jobId,
        count: sql<number>`count(*)::int`,
      })
      .from(jobApplications)
      .where(inArray(jobApplications.jobId, jobIds))
      .groupBy(jobApplications.jobId);

    const countMap = new Map(applicationCounts.map((c) => [c.jobId, c.count]));
    jobsWithCounts = jobs.map((job) => ({
      ...job,
      applicationCount: countMap.get(job.id) || 0,
    }));
  }

  // Optionally check if creator has applied
  let creatorApplications: Map<string, { status: string; appliedAt: Date }> = new Map();
  if (creatorId && jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id);
    const applications = await db
      .select({
        jobId: jobApplications.jobId,
        status: jobApplications.status,
        createdAt: jobApplications.createdAt,
      })
      .from(jobApplications)
      .where(
        and(
          inArray(jobApplications.jobId, jobIds),
          eq(jobApplications.creatorId, creatorId)
        )
      );

    creatorApplications = new Map(
      applications.map((a) => [a.jobId, { status: a.status, appliedAt: a.createdAt }])
    );
  }

  // Add creator application info to jobs if creatorId provided
  if (creatorId) {
    jobsWithCounts = jobsWithCounts.map((job) => ({
      ...job,
      creatorApplication: creatorApplications.get(job.id) || null,
    }));
  }

  return {
    jobs: jobsWithCounts,
    total,
    limit,
    offset,
  };
}

export async function getJobById(jobId: string, creatorId?: string) {
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

  // Get application count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobApplications)
    .where(eq(jobApplications.jobId, jobId));

  const result: {
    job: typeof job[0] & { applicationCount: number; creatorApplication?: { status: string; appliedAt: Date } | null };
  } = {
    job: {
      ...job[0],
      applicationCount: countResult[0]?.count || 0,
    },
  };

  // Check if creator has applied
  if (creatorId) {
    const application = await db
      .select({
        status: jobApplications.status,
        createdAt: jobApplications.createdAt,
      })
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.jobId, jobId),
          eq(jobApplications.creatorId, creatorId)
        )
      )
      .limit(1);

    result.job.creatorApplication = application[0]
      ? { status: application[0].status, appliedAt: application[0].createdAt }
      : null;
  }

  return result;
}

export async function incrementJobViewCount(jobId: string) {
  await db
    .update(contentJobs)
    .set({ viewCount: sql`${contentJobs.viewCount} + 1` })
    .where(eq(contentJobs.id, jobId));
}

export async function createJobApplication(jobId: string, creatorId: string, note?: string) {
  const result = await db
    .insert(jobApplications)
    .values({
      jobId,
      creatorId,
      note,
      status: "interested",
    })
    .onConflictDoNothing()
    .returning();

  return result[0] || null;
}

export async function getJobApplications(jobId: string) {
  return db
    .select({
      id: jobApplications.id,
      jobId: jobApplications.jobId,
      creatorId: jobApplications.creatorId,
      status: jobApplications.status,
      note: jobApplications.note,
      createdAt: jobApplications.createdAt,
      updatedAt: jobApplications.updatedAt,
      creator: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        subdomain: users.subdomain,
        niches: users.niches,
        tagline: users.tagline,
      },
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.creatorId, users.id))
    .where(eq(jobApplications.jobId, jobId))
    .orderBy(desc(jobApplications.createdAt));
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

  // Get application counts
  if (jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id);
    const applicationCounts = await db
      .select({
        jobId: jobApplications.jobId,
        count: sql<number>`count(*)::int`,
      })
      .from(jobApplications)
      .where(inArray(jobApplications.jobId, jobIds))
      .groupBy(jobApplications.jobId);

    const countMap = new Map(applicationCounts.map((c) => [c.jobId, c.count]));
    const jobsWithCounts = jobs.map((job) => ({
      ...job,
      applicationCount: countMap.get(job.id) || 0,
    }));

    return {
      jobs: jobsWithCounts,
      total,
      limit,
      offset,
    };
  }

  return {
    jobs: jobs.map((job) => ({ ...job, applicationCount: 0 })),
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

  // Get application count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobApplications)
    .where(eq(jobApplications.jobId, jobId));

  return {
    job: {
      ...job[0],
      applicationCount: countResult[0]?.count || 0,
    },
  };
}
