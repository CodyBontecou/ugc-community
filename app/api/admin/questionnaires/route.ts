import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboardingQuestionnaires, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { desc, eq } from "drizzle-orm";

// GET /api/admin/questionnaires - Get all questionnaire responses (admin only)
export async function GET() {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questionnaires = await db
      .select({
        id: onboardingQuestionnaires.id,
        userId: onboardingQuestionnaires.userId,
        portfolioVision: onboardingQuestionnaires.portfolioVision,
        inspiringBrands: onboardingQuestionnaires.inspiringBrands,
        portfolioExamples: onboardingQuestionnaires.portfolioExamples,
        createdAt: onboardingQuestionnaires.createdAt,
        updatedAt: onboardingQuestionnaires.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        userSubdomain: users.subdomain,
      })
      .from(onboardingQuestionnaires)
      .innerJoin(users, eq(onboardingQuestionnaires.userId, users.id))
      .orderBy(desc(onboardingQuestionnaires.createdAt));

    return NextResponse.json({ questionnaires });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching questionnaires:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaires" },
      { status: 500 }
    );
  }
}
