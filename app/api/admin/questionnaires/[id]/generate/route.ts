import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  users,
  onboardingQuestionnaires,
  portfolioGenerations,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

// =====================================================
// Types
// =====================================================

interface GenerateResponse {
  success: boolean;
  generationId?: string;
  status?: string;
  message?: string;
  error?: string;
  step?: string;
}

// =====================================================
// POST /api/admin/questionnaires/[id]/generate
// Dispatches portfolio generation to Inngest background job
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GenerateResponse>> {
  try {
    // Step 1: Validate admin access
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required", step: "auth" },
        { status: 403 }
      );
    }

    const { id: questionnaireId } = await params;

    // Parse optional custom instructions from request body
    let customPrompt: string | undefined;
    try {
      const body = await request.json();
      customPrompt = body.customPrompt || undefined;
    } catch {
      // No body or invalid JSON is fine - customPrompt stays undefined
    }

    // Step 2: Load questionnaire and user
    const questionnaires = await db
      .select({
        id: onboardingQuestionnaires.id,
        userId: onboardingQuestionnaires.userId,
        userSubdomain: users.subdomain,
      })
      .from(onboardingQuestionnaires)
      .innerJoin(users, eq(onboardingQuestionnaires.userId, users.id))
      .where(eq(onboardingQuestionnaires.id, questionnaireId));

    if (questionnaires.length === 0) {
      return NextResponse.json(
        { success: false, error: "Questionnaire not found", step: "load" },
        { status: 404 }
      );
    }

    const q = questionnaires[0];

    // Step 3: Validate prerequisites
    if (!q.userSubdomain) {
      return NextResponse.json(
        {
          success: false,
          error: "User does not have a subdomain configured",
          step: "validate",
        },
        { status: 400 }
      );
    }

    // Step 4: Create generation record
    const [generation] = await db
      .insert(portfolioGenerations)
      .values({
        userId: q.userId,
        questionnaireId: questionnaireId,
        status: "pending",
      })
      .returning({ id: portfolioGenerations.id });

    // Step 5: Dispatch to Inngest background job
    await inngest.send({
      name: "portfolio/generate.requested",
      data: {
        generationId: generation.id,
        questionnaireId,
        userId: q.userId,
        customPrompt,
      },
    });

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      status: "pending",
      message: "Generation started. Check status for updates.",
    });
  } catch (error) {
    console.error("Portfolio generation dispatch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        step: "dispatch",
      },
      { status: 500 }
    );
  }
}
