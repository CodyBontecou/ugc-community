import { db } from "../lib/db";
import { users, portfolioGenerations } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { deletePortfolio } from "../lib/portfolio/storage";

const subdomain = process.argv[2];

if (!subdomain) {
  console.error("Usage: pnpm tsx scripts/cleanup-portfolio.ts <subdomain>");
  process.exit(1);
}

async function cleanup() {
  console.log(`Looking for user with subdomain: ${subdomain}`);

  // Find the user
  const user = await db.query.users.findFirst({
    where: eq(users.subdomain, subdomain),
  });

  if (!user) {
    console.error(`User with subdomain "${subdomain}" not found`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.id})`);

  // Delete portfolio generations for this user
  const deleted = await db
    .delete(portfolioGenerations)
    .where(eq(portfolioGenerations.userId, user.id))
    .returning();

  console.log(`Deleted ${deleted.length} portfolio generation records`);

  // Delete blob files for this subdomain
  const deletedBlobCount = await deletePortfolio(subdomain);
  console.log(`Deleted ${deletedBlobCount} blob files`);

  // Disable site
  await db
    .update(users)
    .set({
      siteEnabled: false,
    })
    .where(eq(users.id, user.id));

  console.log("Set siteEnabled to false");
  console.log("Cleanup complete!");
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
