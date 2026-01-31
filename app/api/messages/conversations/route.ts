import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { listUserConversations, getUnreadCount } from "@/lib/messages/queries";

// GET /api/messages/conversations - List user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const [result, totalUnread] = await Promise.all([
      listUserConversations(session.user.id, limit, offset),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({
      conversations: result.conversations,
      total: result.total,
      totalUnread,
    });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}
