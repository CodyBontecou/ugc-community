import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { updatePortfolioSeo } from "@/lib/templates/queries";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seo } = await request.json();
    if (!seo) {
      return NextResponse.json(
        { error: "SEO data required" },
        { status: 400 }
      );
    }

    const config = await updatePortfolioSeo(session.user.id, seo);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to update SEO:", error);
    return NextResponse.json(
      { error: "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}
