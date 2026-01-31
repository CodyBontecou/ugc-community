-- Messaging System Tables
-- Standalone messaging for direct brand<->creator communication

-- Conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" text NOT NULL,
  "name" text,
  "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "last_message_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "conversations_created_by_idx" ON "conversations" ("created_by");
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at");

-- Conversation Participants table
CREATE TABLE IF NOT EXISTS "conversation_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'member' NOT NULL,
  "joined_at" timestamp DEFAULT now() NOT NULL,
  "left_at" timestamp,
  "last_read_at" timestamp,
  "muted_until" timestamp
);

CREATE INDEX IF NOT EXISTS "conversation_participants_conversation_id_idx" ON "conversation_participants" ("conversation_id");
CREATE INDEX IF NOT EXISTS "conversation_participants_user_id_idx" ON "conversation_participants" ("user_id");
CREATE INDEX IF NOT EXISTS "conversation_participants_user_active_idx" ON "conversation_participants" ("user_id", "left_at");
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_unique" UNIQUE ("conversation_id", "user_id");

-- Messages table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "type" text DEFAULT 'text' NOT NULL,
  "reply_to_id" uuid REFERENCES "messages"("id") ON DELETE SET NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "edited_at" timestamp,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "messages_conversation_created_idx" ON "messages" ("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" ("sender_id");

-- Message Reactions table
CREATE TABLE IF NOT EXISTS "message_reactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "message_id" uuid NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "emoji" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "message_reactions_message_id_idx" ON "message_reactions" ("message_id");
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_unique" UNIQUE ("message_id", "user_id", "emoji");

-- Message Read Receipts table
CREATE TABLE IF NOT EXISTS "message_read_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "message_id" uuid NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "read_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "message_read_receipts_message_id_idx" ON "message_read_receipts" ("message_id");
CREATE INDEX IF NOT EXISTS "message_read_receipts_user_id_idx" ON "message_read_receipts" ("user_id");
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_unique" UNIQUE ("message_id", "user_id");
