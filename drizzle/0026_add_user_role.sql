-- Add role column to users table
-- "creator" (default) can access all features
-- "brand" cannot access milestones, portfolio, or media features
ALTER TABLE "users" ADD COLUMN "role" text NOT NULL DEFAULT 'creator';
