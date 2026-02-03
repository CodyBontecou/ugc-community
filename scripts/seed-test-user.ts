import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { nanoid } from "nanoid";
import { hashPassword } from "better-auth/crypto";

async function seedTestUser() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const testEmail = "test@example.com";
  const testPassword = "testpassword123";

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, testEmail),
  });

  if (existingUser) {
    console.log("Test user already exists:");
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
    console.log(`  User ID: ${existingUser.id}`);
    return;
  }

  // Create user
  const userId = nanoid();
  const hashedPassword = await hashPassword(testPassword);

  await db.insert(schema.users).values({
    id: userId,
    name: "Test User",
    email: testEmail,
    emailVerified: true,
    username: "testuser",
    displayName: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create account with password (better-auth style)
  const accountId = nanoid();
  await db.insert(schema.accounts).values({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ Test user created successfully!");
  console.log(`  Email: ${testEmail}`);
  console.log(`  Password: ${testPassword}`);
  console.log(`  User ID: ${userId}`);
}

seedTestUser().catch(console.error);
