import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  onboardingQuestionnaires,
  portfolioGenerations,
  users,
} from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { createPortfolioRepo } from "@/lib/github/push-portfolio";
import { inngest } from "@/lib/inngest/client";
import {
  validateSubdomain,
  generateSubdomainSuggestions,
} from "@/lib/validation/subdomain";

const submitQuestionnaireSchema = z.object({
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters"),
  portfolioVision: z.string().min(10, "Please describe your portfolio vision (at least 10 characters)").max(2000),
  inspiringBrands: z.string().max(1000).optional(),
  portfolioExamples: z.string().max(1000).optional(),
});

// GET /api/onboarding - Check if user has submitted questionnaire
export async function GET() {
  try {
    const session = await requireAuth();

    // Get questionnaire and user subdomain
    const [existing, user] = await Promise.all([
      db.query.onboardingQuestionnaires.findFirst({
        where: eq(onboardingQuestionnaires.userId, session.user.id),
      }),
      db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { subdomain: true },
      }),
    ]);

    return NextResponse.json({
      hasSubmitted: !!existing,
      questionnaire: existing || null,
      subdomain: user?.subdomain || null,
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

    // Validate subdomain format, reserved words, profanity
    const subdomainValidation = validateSubdomain(validated.subdomain);
    if (!subdomainValidation.valid) {
      return NextResponse.json(
        { error: subdomainValidation.error },
        { status: 400 }
      );
    }
    const normalizedSubdomain = subdomainValidation.normalized!;

    // Get user info for GitHub repo creation
    const [user] = await db
      .select({
        subdomain: users.subdomain,
        name: users.name,
        githubRepoFullName: users.githubRepoFullName,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    // Check if subdomain is already taken by another user
    const existingSubdomain = await db.query.users.findFirst({
      where: eq(users.subdomain, normalizedSubdomain),
    });

    if (existingSubdomain && existingSubdomain.id !== session.user.id) {
      const suggestions = generateSubdomainSuggestions(normalizedSubdomain);
      return NextResponse.json(
        {
          error: "This subdomain is already taken",
          suggestions,
        },
        { status: 400 }
      );
    }

    // Check if already submitted questionnaire
    const existing = await db.query.onboardingQuestionnaires.findFirst({
      where: eq(onboardingQuestionnaires.userId, session.user.id),
    });

    if (existing) {
      // Update existing - don't re-trigger generation
      // But do update subdomain if changed
      if (user?.subdomain !== normalizedSubdomain) {
        await db
          .update(users)
          .set({
            subdomain: normalizedSubdomain,
            updatedAt: new Date(),
          })
          .where(eq(users.id, session.user.id));
      }

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
        subdomain: normalizedSubdomain,
      });
    }

    // Set subdomain on user if not already set or different
    if (user?.subdomain !== normalizedSubdomain) {
      await db
        .update(users)
        .set({
          subdomain: normalizedSubdomain,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    }

    const githubToken = process.env.GITHUB_SERVICE_TOKEN;
    const githubUsername = process.env.GITHUB_SERVICE_USERNAME;

    if (!githubToken || !githubUsername) {
      console.error("Missing GITHUB_SERVICE_TOKEN or GITHUB_SERVICE_USERNAME env vars");
      return NextResponse.json(
        { error: "Portfolio generation is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Create GitHub repo if user doesn't have one yet
    let repoFullName = user.githubRepoFullName;
    let repoId: string | null = null;

    if (!repoFullName) {
      try {
        const octokit = new Octokit({ auth: githubToken });
        const repoResult = await createPortfolioRepo(octokit, normalizedSubdomain, {
          description: `Portfolio website for ${user?.name || normalizedSubdomain}`,
          isPrivate: false,
        });

        repoFullName = repoResult.repoFullName;
        repoId = String(repoResult.repoId);

        // Update user with repo info
        await db
          .update(users)
          .set({
            githubRepoFullName: repoFullName,
            githubRepoId: repoId,
          })
          .where(eq(users.id, session.user.id));
      } catch (repoError) {
        console.error("Failed to create GitHub repo:", repoError);
        return NextResponse.json(
          { error: "Failed to create portfolio repository. Please try again." },
          { status: 500 }
        );
      }
    }

    // Create new questionnaire
    const [created] = await db
      .insert(onboardingQuestionnaires)
      .values({
        userId: session.user.id,
        portfolioVision: validated.portfolioVision,
        inspiringBrands: validated.inspiringBrands || null,
        portfolioExamples: validated.portfolioExamples || null,
      })
      .returning();

    // Create generation record and trigger Inngest
    const [generation] = await db
      .insert(portfolioGenerations)
      .values({
        userId: session.user.id,
        questionnaireId: created.id,
        status: "pending",
        githubRepo: repoFullName,
      })
      .returning({ id: portfolioGenerations.id });

    // Dispatch to Inngest for portfolio generation
    await inngest.send({
      name: "portfolio/generate.requested",
      data: {
        generationId: generation.id,
        questionnaireId: created.id,
        userId: session.user.id,
        githubRepoFullName: repoFullName,
      },
    });

    return NextResponse.json({
      message: "Questionnaire submitted - your portfolio is being generated!",
      questionnaire: created,
      generationId: generation.id,
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
