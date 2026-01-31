import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { createConversation } from "@/lib/messages/queries";
import type { ConversationType } from "@/lib/messages/constants";

// POST /api/messages - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, participantIds, name } = body as {
      type: ConversationType;
      participantIds: string[];
      name?: string;
    };

    if (!type || !participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure current user is in participants
    const allParticipants = participantIds.includes(session.user.id)
      ? participantIds
      : [session.user.id, ...participantIds];

    // Validate participant count for direct conversations
    if (type === "direct" && allParticipants.length !== 2) {
      return NextResponse.json(
        { error: "Direct conversations must have exactly 2 participants" },
        { status: 400 }
      );
    }

    const conversation = await createConversation(
      session.user.id,
      type,
      allParticipants,
      name
    );

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
