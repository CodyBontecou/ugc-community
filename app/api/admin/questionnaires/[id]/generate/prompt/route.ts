import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  onboardingQuestionnaires,
  users,
  portfolioProjects,
  portfolioProjectMedia,
} from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import {
  buildPortfolioPrompt,
  QuestionnaireData,
  PortfolioProjectData,
} from "@/lib/agent/portfolio-prompt";

interface PromptResponse {
  success: boolean;
  prompt?: string;
  error?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const projects = await db.query.portfolioProjects.findMany({
      where: eq(portfolioProjects.userId, questionnaire.userId),
      orderBy: [asc(portfolioProjects.displayOrder)],
      with: {
        projectMedia: {
          orderBy: [asc(portfolioProjectMedia.displayOrder)],
          with: {
            media: true,
          },
        },
      },
    });

    const portfolioProjectsData: PortfolioProjectData[] = projects.map((project) => {
      const mediaUrls = project.projectMedia.map((pm) => pm.media.url);
      const coverMedia = project.projectMedia.find((pm) => pm.isCover);
      const coverUrl = coverMedia?.media.url || mediaUrls[0];

      return {
        title: project.title,
        brandName: project.brandName,
        campaignDescription: project.campaignDescription,
        contentType: project.contentType,
        platforms: project.platforms,
        results: project.results,
        mediaUrls,
        coverUrl,
      };
    });

    const questionnaireData: QuestionnaireData = {
      portfolioVision: questionnaire.portfolioVision,
      inspiringBrands: questionnaire.inspiringBrands,
      portfolioExamples: questionnaire.portfolioExamples,
      creatorName: questionnaire.creatorName,
      subdomain: questionnaire.subdomain,
      portfolioProjects: portfolioProjectsData,
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
