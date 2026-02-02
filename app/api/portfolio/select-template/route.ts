import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { selectTemplate } from "@/lib/templates/queries";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await request.json();
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    const config = await selectTemplate(session.user.id, templateId);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to select template:", error);
    return NextResponse.json(
      { error: "Failed to select template" },
      { status: 500 }
    );
  }
}
