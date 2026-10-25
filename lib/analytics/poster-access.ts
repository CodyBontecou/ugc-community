import "server-only";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
export class PosterAccessError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function posterSession() {
  const session = await getServerSession();
  if (!session) throw new PosterAccessError("Sign in to view your postings", 401);
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { id: true, status: true } });
  if (!user || user.status !== "active") throw new PosterAccessError("Your account cannot access posting analytics", 403);
  return user;
}
