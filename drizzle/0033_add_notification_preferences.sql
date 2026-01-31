-- Add email notification preference columns to users table

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_on_job_application" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_on_application_update" boolean DEFAULT true;
