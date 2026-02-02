import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { setPortfolioPublished } from "@/lib/templates/queries";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isPublished } = await request.json();
    if (typeof isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished boolean required" },
        { status: 400 }
      );
    }

    const config = await setPortfolioPublished(session.user.id, isPublished);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to update publish status:", error);
    return NextResponse.json(
      { error: "Failed to update publish status" },
      { status: 500 }
    );
  }
}
