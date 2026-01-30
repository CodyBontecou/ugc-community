-- Content Jobs: Job listings for creators
CREATE TABLE IF NOT EXISTS "content_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "hooks" jsonb DEFAULT '[]'::jsonb,
  "compensation_type" text NOT NULL DEFAULT 'paid',
  "compensation_details" text,
  "niches" text[] DEFAULT '{}',
  "platforms" text[] DEFAULT '{}',
  "status" text NOT NULL DEFAULT 'draft',
  "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "brand_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "is_featured" boolean NOT NULL DEFAULT false,
  "deadline_at" timestamp,
  "view_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "published_at" timestamp
);

-- Job Applications: Creator interest tracking
CREATE TABLE IF NOT EXISTS "job_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL REFERENCES "content_jobs"("id") ON DELETE CASCADE,
  "creator_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'interested',
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for content_jobs
CREATE INDEX IF NOT EXISTS "content_jobs_status_idx" ON "content_jobs" ("status");
CREATE INDEX IF NOT EXISTS "content_jobs_created_by_idx" ON "content_jobs" ("created_by");
CREATE INDEX IF NOT EXISTS "content_jobs_brand_id_idx" ON "content_jobs" ("brand_id");
CREATE INDEX IF NOT EXISTS "content_jobs_created_at_idx" ON "content_jobs" ("created_at");

-- Indexes for job_applications
CREATE UNIQUE INDEX IF NOT EXISTS "job_applications_job_creator_unique" ON "job_applications" ("job_id", "creator_id");
CREATE INDEX IF NOT EXISTS "job_applications_job_id_idx" ON "job_applications" ("job_id");
CREATE INDEX IF NOT EXISTS "job_applications_creator_id_idx" ON "job_applications" ("creator_id");
CREATE INDEX IF NOT EXISTS "job_applications_status_idx" ON "job_applications" ("status");
