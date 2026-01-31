-- Add notifications table for in-app notifications

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text,
  "link" text,
  "metadata" jsonb DEFAULT '{}',
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "notifications_user_id_idx" ON "notifications" ("user_id");
CREATE INDEX "notifications_user_read_idx" ON "notifications" ("user_id", "read_at");
CREATE INDEX "notifications_created_at_idx" ON "notifications" ("created_at");
