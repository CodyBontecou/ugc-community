-- Add saved_creators table for brands to save/favorite creators
CREATE TABLE IF NOT EXISTS "saved_creators" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "creator_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Ensure a brand can only save a creator once
CREATE UNIQUE INDEX "saved_creators_brand_creator_unique" ON "saved_creators" ("brand_id", "creator_id");

-- Index for efficient lookups by brand (list all saved creators for a brand)
CREATE INDEX "saved_creators_brand_id_idx" ON "saved_creators" ("brand_id");

-- Index for efficient lookups by creator (see which brands saved a creator)
CREATE INDEX "saved_creators_creator_id_idx" ON "saved_creators" ("creator_id");
