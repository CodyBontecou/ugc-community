-- Migration: Add onboarding questionnaires table
-- This table stores portfolio design questionnaire responses from new creators

CREATE TABLE IF NOT EXISTS "onboarding_questionnaires" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "portfolio_vision" text NOT NULL,
  "inspiring_brands" text,
  "portfolio_examples" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "onboarding_questionnaires_user_id_idx" ON "onboarding_questionnaires" ("user_id");
CREATE INDEX IF NOT EXISTS "onboarding_questionnaires_created_at_idx" ON "onboarding_questionnaires" ("created_at");
