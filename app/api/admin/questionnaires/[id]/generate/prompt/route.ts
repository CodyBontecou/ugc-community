import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  onboardingQuestionnaires,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  buildPortfolioPrompt,
  QuestionnaireData,
} from "@/lib/agent/portfolio-prompt";

interface PromptResponse {
  success: boolean;
  prompt?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PromptResponse>> {
  return handlePromptPreview(request, params);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PromptResponse>> {
  return handlePromptPreview(null, params);
}

async function handlePromptPreview(
  request: NextRequest | null,
  params: Promise<{ id: string }>
): Promise<NextResponse<PromptResponse>> {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: questionnaireId } = await params;

    // Parse optional custom instructions from POST body
    let customInstructions: string | undefined;
    if (request) {
      try {
        const body = await request.json();
        customInstructions = body.customPrompt || undefined;
      } catch {
        // No body or invalid JSON is fine
      }
    }

    const [questionnaire] = await db
      .select({
        portfolioVision: onboardingQuestionnaires.portfolioVision,
        inspiringBrands: onboardingQuestionnaires.inspiringBrands,
        portfolioExamples: onboardingQuestionnaires.portfolioExamples,
        userId: onboardingQuestionnaires.userId,
        creatorName: users.name,
        subdomain: users.subdomain,
      })
      .from(onboardingQuestionnaires)
      .innerJoin(users, eq(onboardingQuestionnaires.userId, users.id))
      .where(eq(onboardingQuestionnaires.id, questionnaireId));

    if (!questionnaire) {
      return NextResponse.json(
        { success: false, error: "Questionnaire not found" },
        { status: 404 }
      );
    }

    if (!questionnaire.subdomain) {
      return NextResponse.json(
        {
          success: false,
          error: "User does not have a subdomain configured",
        },
        { status: 400 }
      );
    }

    const questionnaireData: QuestionnaireData = {
      portfolioVision: questionnaire.portfolioVision,
      inspiringBrands: questionnaire.inspiringBrands,
      portfolioExamples: questionnaire.portfolioExamples,
      creatorName: questionnaire.creatorName,
      subdomain: questionnaire.subdomain,
      customInstructions,
    };

    const prompt = buildPortfolioPrompt(questionnaireData);

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error("Prompt preview error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
