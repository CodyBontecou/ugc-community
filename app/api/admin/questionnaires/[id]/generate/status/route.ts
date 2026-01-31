import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { portfolioGenerations, onboardingQuestionnaires } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// =====================================================
// Types
// =====================================================

interface StatusResponse {
  success: boolean;
  generation?: {
    id: string;
    status: string;
    githubRepo: string | null;
    deploymentUrl: string | null;
    previewUrl: string | null;
    filesGenerated: number | null;
    error: string | null;
    errorStep: string | null;
    startedAt: Date;
    completedAt: Date | null;
  };
  error?: string;
}

// =====================================================
// GET /api/admin/questionnaires/[id]/generate/status
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<StatusResponse>> {
  try {
    // Validate admin access
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: questionnaireId } = await params;

    // Verify questionnaire exists
    const [questionnaire] = await db
      .select({ id: onboardingQuestionnaires.id })
      .from(onboardingQuestionnaires)
      .where(eq(onboardingQuestionnaires.id, questionnaireId));

    if (!questionnaire) {
      return NextResponse.json(
        { success: false, error: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // Get the most recent generation for this questionnaire
    const [generation] = await db
      .select()
      .from(portfolioGenerations)
      .where(eq(portfolioGenerations.questionnaireId, questionnaireId))
      .orderBy(desc(portfolioGenerations.startedAt))
      .limit(1);

    if (!generation) {
      return NextResponse.json({
        success: true,
        generation: undefined,
      });
    }

    return NextResponse.json({
      success: true,
      generation: {
        id: generation.id,
        status: generation.status,
        githubRepo: generation.githubRepo,
        deploymentUrl: generation.deploymentUrl,
        previewUrl: generation.previewUrl,
        filesGenerated: generation.filesGenerated,
        error: generation.error,
        errorStep: generation.errorStep,
        startedAt: generation.startedAt,
        completedAt: generation.completedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching generation status:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
