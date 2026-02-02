-- Add inspiring_brands_list as TEXT array for individual brand inputs
ALTER TABLE "onboarding_questionnaires" ADD COLUMN IF NOT EXISTS "inspiring_brands_list" text[] DEFAULT ARRAY[]::text[];
