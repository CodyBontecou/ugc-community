import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboardingQuestionnaires } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

const submitQuestionnaireSchema = z.object({
  portfolioVision: z.string().min(10, "Please describe your portfolio vision (at least 10 characters)").max(2000),
  inspiringBrands: z.string().max(1000).optional(),
  portfolioExamples: z.string().max(1000).optional(),
});

// GET /api/onboarding - Check if user has submitted questionnaire
export async function GET() {
  try {
    const session = await requireAuth();

    const existing = await db.query.onboardingQuestionnaires.findFirst({
      where: eq(onboardingQuestionnaires.userId, session.user.id),
    });

    return NextResponse.json({
      hasSubmitted: !!existing,
      questionnaire: existing || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error checking questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to check questionnaire status" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding - Submit questionnaire
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const validated = submitQuestionnaireSchema.parse(body);

    // Check if already submitted
    const existing = await db.query.onboardingQuestionnaires.findFirst({
      where: eq(onboardingQuestionnaires.userId, session.user.id),
    });

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(onboardingQuestionnaires)
        .set({
          portfolioVision: validated.portfolioVision,
          inspiringBrands: validated.inspiringBrands || null,
          portfolioExamples: validated.portfolioExamples || null,
          updatedAt: new Date(),
        })
        .where(eq(onboardingQuestionnaires.userId, session.user.id))
        .returning();

      return NextResponse.json({
        message: "Questionnaire updated",
        questionnaire: updated,
      });
    }

    // Create new
    const [created] = await db
      .insert(onboardingQuestionnaires)
      .values({
        userId: session.user.id,
        portfolioVision: validated.portfolioVision,
        inspiringBrands: validated.inspiringBrands || null,
        portfolioExamples: validated.portfolioExamples || null,
      })
      .returning();

    return NextResponse.json({
      message: "Questionnaire submitted",
      questionnaire: created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error submitting questionnaire:", error);
    return NextResponse.json(
      { error: "Failed to submit questionnaire" },
      { status: 500 }
    );
  }
}
