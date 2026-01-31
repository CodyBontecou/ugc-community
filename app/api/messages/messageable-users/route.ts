import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getMessageableUsers } from "@/lib/messages/queries";

// GET /api/messages/messageable-users - Get users the current user can message
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();

    let users = await getMessageableUsers(session.user.id);

    // Filter by search query if provided
    if (query && query.length >= 2) {
      users = users.filter((user) => {
        const name = user.name?.toLowerCase() || "";
        const displayName = user.displayName?.toLowerCase() || "";
        return name.includes(query) || displayName.includes(query);
      });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching messageable users:", error);
    return NextResponse.json(
      { error: "Failed to fetch messageable users" },
      { status: 500 }
    );
  }
}
