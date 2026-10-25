import "server-only";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApplicationError } from "./applications";
export async function applicantSession() {
  const session = await getServerSession();
  if (!session) throw new ApplicationError("Sign in to continue", 401);
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { id: true, email: true, emailVerified: true, status: true } });
  if (!user || user.status !== "active") throw new ApplicationError("Your account cannot apply right now", 403);
  return user;
}
