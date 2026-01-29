import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current user's GitHub connection status
    const [user] = await db
      .select({
        githubUsername: users.githubUsername,
        githubConnectedAt: users.githubConnectedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isConnected = !!user.githubUsername && !!user.githubConnectedAt;

    return NextResponse.json({
      connected: isConnected,
      username: user.githubUsername,
      connectedAt: user.githubConnectedAt,
    });
  } catch (error) {
    console.error("GitHub status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
