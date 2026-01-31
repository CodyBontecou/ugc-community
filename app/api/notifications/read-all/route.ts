import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { markAllNotificationsAsRead } from "@/lib/notifications/queries";

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markAllNotificationsAsRead(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
