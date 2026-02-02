import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  onboardingQuestionnaires,
  portfolioGenerations,
  users,
  SocialMediaHandle,
} from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { createPortfolioRepo, waitForRepoInitialized } from "@/lib/github/push-portfolio";
import { inngest } from "@/lib/inngest/client";
import {
  validateSubdomain,
  generateSubdomainSuggestions,
} from "@/lib/validation/subdomain";

const socialMediaHandleSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "twitter", "linkedin", "other"]),
  handle: z.string().min(1, "Handle is required").max(200),
});

const submitQuestionnaireSchema = z.object({
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters"),
  portfolioVision: z.string().min(10, "Please describe your portfolio vision (at least 10 characters)").max(2000),
  inspiringBrands: z.string().max(1000).optional(),
  portfolioExamples: z.string().max(1000).optional(),
  // Structured fields - all required with at least one entry
  socialMediaHandles: z.array(socialMediaHandleSchema).min(1, "Please add at least one social media handle").max(20),
  inspirationUrls: z.array(z.string().url("Invalid URL format")).min(1, "Please add at least one website").max(10),
  inspiringBrandsList: z.array(z.string().min(1).max(200)).min(1, "Please add at least one brand").max(20),
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
      questionnaire: existing ? {
        ...existing,
        // Ensure arrays are returned properly
        socialMediaHandles: existing.socialMediaHandles || [],
        inspirationUrls: existing.inspirationUrls || [],
        inspiringBrandsList: existing.inspiringBrandsList || [],
      } : null,
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
          socialMediaHandles: (validated.socialMediaHandles as SocialMediaHandle[]) || [],
          inspirationUrls: validated.inspirationUrls || [],
          inspiringBrandsList: validated.inspiringBrandsList || [],
          updatedAt: new Date(),
        })
        .where(eq(onboardingQuestionnaires.userId, session.user.id))
        .returning();

      return NextResponse.json({
        message: "Questionnaire updated",
        questionnaire: {
          ...updated,
          socialMediaHandles: updated.socialMediaHandles || [],
          inspirationUrls: updated.inspirationUrls || [],
          inspiringBrandsList: updated.inspiringBrandsList || [],
        },
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

    // Create or verify GitHub repo
    let repoFullName = user.githubRepoFullName;
    let repoId: string | null = null;

    try {
      const octokit = new Octokit({ auth: githubToken });
      const { repoExists, getRepoInfo } = await import("@/lib/github/push-portfolio");
      const expectedRepoName = `${normalizedSubdomain}-portfolio`;
      const expectedRepoFullName = `${process.env.GITHUB_SERVICE_USERNAME}/${expectedRepoName}`;

      // Check if existing repo still exists
      let needsNewRepo = !repoFullName;
      if (repoFullName) {
        const exists = await repoExists(octokit, repoFullName);
        if (!exists) {
          console.log(`Repo ${repoFullName} no longer exists, checking for expected repo`);
          needsNewRepo = true;
        }
      }

      if (needsNewRepo) {
        // Before creating, check if the expected repo already exists (from a previous failed attempt)
        const expectedExists = await repoExists(octokit, expectedRepoFullName);
        
        if (expectedExists) {
          // Repo already exists - use it instead of failing
          console.log(`Found existing repo ${expectedRepoFullName}, linking to user`);
          const repoInfo = await getRepoInfo(octokit, expectedRepoFullName);
          repoFullName = expectedRepoFullName;
          repoId = String(repoInfo.id);
        } else {
          // Create new repo
          const repoResult = await createPortfolioRepo(octokit, normalizedSubdomain, {
            description: `Portfolio website for ${user?.name || normalizedSubdomain}`,
            isPrivate: true,
          });

          repoFullName = repoResult.repoFullName;
          repoId = String(repoResult.repoId);

          // Wait for repo to be initialized (auto_init creates commit asynchronously)
          await waitForRepoInitialized(octokit, repoFullName);
        }

        // Update user with repo info
        await db
          .update(users)
          .set({
            githubRepoFullName: repoFullName,
            githubRepoId: repoId,
          })
          .where(eq(users.id, session.user.id));
      }
    } catch (repoError) {
      console.error("Failed to create/verify GitHub repo:", repoError);
      return NextResponse.json(
        { error: "Failed to create portfolio repository. Please try again." },
        { status: 500 }
      );
    }

    // Create new questionnaire
    const [created] = await db
      .insert(onboardingQuestionnaires)
      .values({
        userId: session.user.id,
        portfolioVision: validated.portfolioVision,
        inspiringBrands: validated.inspiringBrands || null,
        portfolioExamples: validated.portfolioExamples || null,
        socialMediaHandles: (validated.socialMediaHandles as SocialMediaHandle[]) || [],
        inspirationUrls: validated.inspirationUrls || [],
        inspiringBrandsList: validated.inspiringBrandsList || [],
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
        githubRepoFullName: repoFullName || undefined,
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
        { error: error.issues[0]?.message || "Invalid data" },
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
