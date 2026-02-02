import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { updatePortfolioTheme } from "@/lib/templates/queries";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { theme } = await request.json();
    if (!theme) {
      return NextResponse.json(
        { error: "Theme data required" },
        { status: 400 }
      );
    }

    const config = await updatePortfolioTheme(session.user.id, theme);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 }
    );
  }
}
