import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getConversationUpdates, isParticipant } from "@/lib/messages/queries";

// GET /api/messages/updates - Poll for new messages/reactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const since = searchParams.get("since");

    if (!conversationId || !since) {
      return NextResponse.json(
        { error: "Missing conversationId or since parameter" },
        { status: 400 }
      );
    }

    // Verify user is participant
    const participant = await isParticipant(conversationId, session.user.id);
    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this conversation" },
        { status: 403 }
      );
    }

    const sinceDate = new Date(since);
    const updates = await getConversationUpdates(conversationId, sinceDate);

    return NextResponse.json(updates);
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}
