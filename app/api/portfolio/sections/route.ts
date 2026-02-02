import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { updatePortfolioSections } from "@/lib/templates/queries";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sections } = await request.json();
    if (!sections) {
      return NextResponse.json(
        { error: "Sections data required" },
        { status: 400 }
      );
    }

    const config = await updatePortfolioSections(session.user.id, sections);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to update sections:", error);
    return NextResponse.json(
      { error: "Failed to update sections" },
      { status: 500 }
    );
  }
}
