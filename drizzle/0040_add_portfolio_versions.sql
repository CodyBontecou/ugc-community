-- Add portfolio_versions table for version history tracking
CREATE TABLE IF NOT EXISTS "portfolio_versions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "portfolio_id" uuid NOT NULL REFERENCES "portfolios"("id") ON DELETE CASCADE,
    "html_content" text NOT NULL,
    "version_number" integer NOT NULL,
    "title" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "portfolio_versions_portfolio_id_idx" ON "portfolio_versions" ("portfolio_id");
CREATE INDEX IF NOT EXISTS "portfolio_versions_created_at_idx" ON "portfolio_versions" ("created_at");
