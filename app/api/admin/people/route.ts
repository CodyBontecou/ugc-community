import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export type RecordType = "user";

export interface UnifiedRecord {
  id: string;
  type: RecordType;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  image?: string | null;
  subdomain?: string | null;
  displayName?: string | null;
}

// GET /api/admin/people - List all users
export async function GET() {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        displayName: users.displayName,
        subdomain: users.subdomain,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const records: UnifiedRecord[] = allUsers.map((user) => ({
      id: user.id,
      type: "user" as const,
      email: user.email,
      name: user.name,
      status: user.status || "active",
      createdAt: user.createdAt.toISOString(),
      image: user.image,
      subdomain: user.subdomain,
      displayName: user.displayName,
    }));

    return NextResponse.json({ records });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing people:", error);
    return NextResponse.json({ error: "Failed to list people" }, { status: 500 });
  }
}
