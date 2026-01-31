import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  getParticipants,
  addParticipant,
  removeParticipant,
  isParticipant,
  getConversation,
} from "@/lib/messages/queries";

// GET /api/messages/conversations/[conversationId]/participants
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

    const participants = await getParticipants(conversationId);

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations/[conversationId]/participants - Add participant
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

    // Get conversation to check type and ownership
    const conversation = await getConversation(conversationId, session.user.id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Only allow adding participants to group conversations
    if (conversation.type === "direct") {
      return NextResponse.json(
        { error: "Cannot add participants to direct conversations" },
        { status: 400 }
      );
    }

    // Check if user is owner
    const currentParticipant = conversation.participants.find(
      (p) => p.userId === session.user.id
    );
    if (currentParticipant?.role !== "owner") {
      return NextResponse.json(
        { error: "Only conversation owner can add participants" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const participant = await addParticipant(conversationId, userId, "member");

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/conversations/[conversationId]/participants - Remove participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get conversation to check ownership
    const conversation = await getConversation(conversationId, session.user.id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Allow self-removal or owner removal of others
    const currentParticipant = conversation.participants.find(
      (p) => p.userId === session.user.id
    );
    const isSelf = userId === session.user.id;
    const isOwner = currentParticipant?.role === "owner";

    if (!isSelf && !isOwner) {
      return NextResponse.json(
        { error: "Only conversation owner can remove other participants" },
        { status: 403 }
      );
    }

    await removeParticipant(conversationId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}
