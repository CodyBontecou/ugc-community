import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { addReaction, removeReaction, isParticipant } from "@/lib/messages/queries";

// POST /api/messages/conversations/[conversationId]/reactions/[messageId] - Add reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, messageId } = await params;

    // Verify user is participant
    const participant = await isParticipant(conversationId, session.user.id);
    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this conversation" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { emoji } = body as { emoji: string };

    if (!emoji) {
      return NextResponse.json(
        { error: "emoji is required" },
        { status: 400 }
      );
    }

    const reaction = await addReaction(messageId, session.user.id, emoji);

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/conversations/[conversationId]/reactions/[messageId] - Remove reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, messageId } = await params;

    // Verify user is participant
    const participant = await isParticipant(conversationId, session.user.id);
    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this conversation" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get("emoji");

    if (!emoji) {
      return NextResponse.json(
        { error: "emoji is required" },
        { status: 400 }
      );
    }

    await removeReaction(messageId, session.user.id, emoji);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
}
