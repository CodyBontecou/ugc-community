-- Add application messages table for brand-creator communication

CREATE TABLE IF NOT EXISTS "application_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "job_applications"("id") ON DELETE CASCADE,
  "sender_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "application_messages_application_id_idx" ON "application_messages" ("application_id");
CREATE INDEX "application_messages_created_at_idx" ON "application_messages" ("created_at");
