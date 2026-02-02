-- Add structured fields to onboarding_questionnaires for better data management
-- social_media_handles: JSONB array of {platform, handle} objects
-- inspiration_urls: TEXT array of individual validated URLs

ALTER TABLE "onboarding_questionnaires" ADD COLUMN IF NOT EXISTS "social_media_handles" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "onboarding_questionnaires" ADD COLUMN IF NOT EXISTS "inspiration_urls" text[] DEFAULT ARRAY[]::text[];
