import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { markConversationRead, isParticipant } from "@/lib/messages/queries";

// POST /api/messages/conversations/[conversationId]/read - Mark conversation read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is participant
    const participant = await isParticipant(conversationId, session.user.id);
    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this conversation" },
        { status: 403 }
      );
    }

    await markConversationRead(conversationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking conversation read:", error);
    return NextResponse.json(
      { error: "Failed to mark conversation read" },
      { status: 500 }
    );
  }
}
