import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notifications/queries";

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";

    if (countOnly) {
      const unreadCount = await getUnreadNotificationCount(session.user.id);
      return NextResponse.json({ unreadCount });
    }

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(session.user.id, 50),
      getUnreadNotificationCount(session.user.id),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
