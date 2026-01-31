import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getMessageableUsers, getAllUsersForAdmin } from "@/lib/messages/queries";
import { isAdmin } from "@/lib/admin";

// GET /api/messages/messageable-users - Get users the current user can message
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();

    // Admins can message anyone
    const userIsAdmin = isAdmin(session.user.email);

    let users: {
      id: string;
      name: string;
      displayName: string | null;
      image: string | null;
      role: string;
      interactionType?: "application" | "saved" | "admin";
    }[];

    if (userIsAdmin) {
      // For admins, search all users
      users = await getAllUsersForAdmin(session.user.id, query);
    } else {
      // For regular users, only return users they've interacted with
      users = await getMessageableUsers(session.user.id);

      // Filter by search query if provided
      if (query && query.length >= 2) {
        users = users.filter((user) => {
          const name = user.name?.toLowerCase() || "";
          const displayName = user.displayName?.toLowerCase() || "";
          return name.includes(query) || displayName.includes(query);
        });
      }
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
