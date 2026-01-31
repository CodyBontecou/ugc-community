import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  setTypingIndicator,
  getTypingIndicators,
  isParticipant,
} from "@/lib/messages/queries";

// GET /api/messages/conversations/[conversationId]/typing - Get typing indicators
export async function GET(
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

    const typingUsers = await getTypingIndicators(conversationId, session.user.id);

    return NextResponse.json({ typingUsers });
  } catch (error) {
    console.error("Error getting typing indicators:", error);
    return NextResponse.json(
      { error: "Failed to get typing indicators" },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations/[conversationId]/typing - Set typing indicator
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

    setTypingIndicator(conversationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting typing indicator:", error);
    return NextResponse.json(
      { error: "Failed to set typing indicator" },
      { status: 500 }
    );
  }
}
