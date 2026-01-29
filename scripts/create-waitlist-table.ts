import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating waitlist table...");

  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      instagram_handle TEXT,
      tiktok_handle TEXT,
      youtube_handle TEXT,
      facebook_handle TEXT,
      twitter_handle TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      invited_at TIMESTAMP,
      invited_by TEXT REFERENCES users(id) ON DELETE SET NULL
    )
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist(email)`;
  await sql`CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist(created_at)`;

  console.log("Waitlist table created successfully!");
}

main().catch(console.error);
