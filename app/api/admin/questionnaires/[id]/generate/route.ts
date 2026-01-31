import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, onboardingQuestionnaires } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generatePortfolio } from "@/lib/agent/portfolio-generator";
import { QuestionnaireData } from "@/lib/agent/portfolio-prompt";
import {
  createPortfolioRepo,
  pushFilesToRepo,
  repoExists,
  getRepoInfo,
} from "@/lib/github/push-portfolio";
import {
  createProject,
  addDomain,
  linkGitHubRepo,
  createDeployment,
  VercelApiError,
} from "@/lib/vercel";

// =====================================================
// Types
// =====================================================

interface GenerateResponse {
  success: boolean;
  githubRepo?: string;
  githubRepoUrl?: string;
  vercelProjectId?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  filesGenerated?: number;
  error?: string;
  step?: string;
}

// =====================================================
// POST /api/admin/questionnaires/[id]/generate
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

    // Step 2: Get admin's GitHub token
    const [adminUser] = await db
      .select({
        githubAccessToken: users.githubAccessToken,
        githubUsername: users.githubUsername,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!adminUser?.githubAccessToken || !adminUser.githubUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "Please connect your GitHub account first",
          step: "github_auth",
        },
        { status: 400 }
      );
    }

    // Step 3: Load questionnaire and user
    const questionnaires = await db
      .select({
        id: onboardingQuestionnaires.id,
        userId: onboardingQuestionnaires.userId,
        portfolioVision: onboardingQuestionnaires.portfolioVision,
        inspiringBrands: onboardingQuestionnaires.inspiringBrands,
        portfolioExamples: onboardingQuestionnaires.portfolioExamples,
        userName: users.name,
        userSubdomain: users.subdomain,
        userVercelProjectId: users.vercelProjectId,
        userGithubRepoFullName: users.githubRepoFullName,
        userGithubRepoId: users.githubRepoId,
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

    // Step 4: Validate prerequisites
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

    // Step 5: Generate portfolio
    const questionnaireData: QuestionnaireData = {
      portfolioVision: q.portfolioVision,
      inspiringBrands: q.inspiringBrands,
      portfolioExamples: q.portfolioExamples,
      creatorName: q.userName,
      subdomain: q.userSubdomain,
    };

    const generationResult = await generatePortfolio(questionnaireData);

    if (!generationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Generation failed: ${generationResult.error}`,
          step: "generate",
          filesGenerated: generationResult.files.length,
        },
        { status: 500 }
      );
    }

    // Step 6: Push to GitHub
    const octokit = new Octokit({ auth: adminUser.githubAccessToken });
    const repoName = `${q.userSubdomain}-portfolio`;
    let repoFullName = q.userGithubRepoFullName;
    let repoId = q.userGithubRepoId;
    let githubRepoUrl: string | undefined;

    // Create repo if doesn't exist
    if (!repoFullName) {
      const expectedRepoName = `${adminUser.githubUsername}/${repoName}`;
      const exists = await repoExists(octokit, expectedRepoName);

      if (exists) {
        // Repo exists, use it
        repoFullName = expectedRepoName;
        const repoInfo = await getRepoInfo(octokit, expectedRepoName);
        repoId = String(repoInfo.id);
        githubRepoUrl = repoInfo.htmlUrl;
      } else {
        // Create new repo
        const createResult = await createPortfolioRepo(
          octokit,
          q.userSubdomain,
          {
            description: `Portfolio website for ${q.userName}`,
            isPrivate: false,
          }
        );
        repoFullName = createResult.repoFullName;
        repoId = String(createResult.repoId);
        githubRepoUrl = createResult.repoUrl;
      }

      // Update user with repo info
      await db
        .update(users)
        .set({
          githubRepoFullName: repoFullName,
          githubRepoId: repoId,
        })
        .where(eq(users.id, q.userId));
    } else {
      const repoInfo = await getRepoInfo(octokit, repoFullName);
      githubRepoUrl = repoInfo.htmlUrl;
    }

    // Push files to repo
    await pushFilesToRepo(
      octokit,
      repoFullName,
      generationResult.files,
      "feat: initial portfolio generated by UGC Community"
    );

    // Step 7: Set up Vercel if needed
    let vercelProjectId = q.userVercelProjectId;
    let deploymentUrl: string | undefined;

    if (!vercelProjectId) {
      // Create Vercel project
      const vercelProject = await createProject({
        name: `${q.userSubdomain}-portfolio`,
        framework: "nextjs",
        gitRepository: {
          type: "github",
          repo: repoFullName,
        },
      });
      vercelProjectId = vercelProject.id;

      // Add subdomain
      const domain = `${q.userSubdomain}.ugc.community`;
      await addDomain(vercelProjectId, domain);

      // Update user with Vercel project ID
      await db
        .update(users)
        .set({
          vercelProjectId,
          siteEnabled: true,
        })
        .where(eq(users.id, q.userId));
    } else {
      // Link repo to existing project if not already linked
      await linkGitHubRepo(vercelProjectId, repoFullName);
    }

    // Step 8: Trigger deployment
    const deployment = await createDeployment(vercelProjectId, {
      target: "production",
      gitSource: {
        type: "github",
        ref: "main",
        repoId: repoId!,
      },
    });

    deploymentUrl = `https://${deployment.url}`;

    return NextResponse.json({
      success: true,
      githubRepo: repoFullName,
      githubRepoUrl,
      vercelProjectId,
      deploymentUrl,
      previewUrl: `https://${q.userSubdomain}.ugc.community`,
      filesGenerated: generationResult.files.length,
    });
  } catch (error) {
    console.error("Portfolio generation error:", error);

    if (error instanceof VercelApiError) {
      return NextResponse.json(
        {
          success: false,
          error: `Vercel error: ${error.message}`,
          step: "vercel",
        },
        { status: error.statusCode >= 500 ? 502 : 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized", step: "auth" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        step: "unknown",
      },
      { status: 500 }
    );
  }
}
