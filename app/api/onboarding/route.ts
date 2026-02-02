import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, portfolioConfigs, templates } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  validateSubdomain,
  generateSubdomainSuggestions,
} from "@/lib/validation/subdomain";

const onboardingSchema = z.object({
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters"),
  templateSlug: z.string().optional(), // Optional - can select template later
});

// GET /api/onboarding - Check onboarding status
export async function GET() {
  try {
    const session = await requireAuth();

    const [user, portfolioConfig] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { subdomain: true },
      }),
      db.query.portfolioConfigs.findFirst({
        where: eq(portfolioConfigs.userId, session.user.id),
        with: {
          template: true,
        },
      }),
    ]);

    return NextResponse.json({
      subdomain: user?.subdomain || null,
      hasPortfolioConfig: !!portfolioConfig,
      portfolioConfig: portfolioConfig || null,
      isPublished: portfolioConfig?.isPublished || false,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding - Set up subdomain and optionally select template
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const validated = onboardingSchema.parse(body);

    // Validate subdomain format, reserved words, profanity
    const subdomainValidation = validateSubdomain(validated.subdomain);
    if (!subdomainValidation.valid) {
      return NextResponse.json(
        { error: subdomainValidation.error },
        { status: 400 }
      );
    }
    const normalizedSubdomain = subdomainValidation.normalized!;

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

    // Update user's subdomain
    await db
      .update(users)
      .set({
        subdomain: normalizedSubdomain,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Create or update portfolio config
    let templateId: string | null = null;
    
    if (validated.templateSlug) {
      const template = await db.query.templates.findFirst({
        where: eq(templates.slug, validated.templateSlug),
      });
      if (template) {
        templateId = template.id;
      }
    }

    // Check if portfolio config already exists
    const existingConfig = await db.query.portfolioConfigs.findFirst({
      where: eq(portfolioConfigs.userId, session.user.id),
    });

    let portfolioConfig;
    
    if (existingConfig) {
      // Update existing config
      [portfolioConfig] = await db
        .update(portfolioConfigs)
        .set({
          ...(templateId ? { templateId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(portfolioConfigs.userId, session.user.id))
        .returning();
    } else {
      // Create new config with default template if none specified
      if (!templateId) {
        // Get the default template (minimal)
        const defaultTemplate = await db.query.templates.findFirst({
          where: eq(templates.slug, "minimal"),
        });
        templateId = defaultTemplate?.id || null;
      }

      [portfolioConfig] = await db
        .insert(portfolioConfigs)
        .values({
          userId: session.user.id,
          templateId,
          sections: {},
          theme: {},
          seo: {},
          isPublished: false,
        })
        .returning();
    }

    return NextResponse.json({
      message: "Onboarding complete",
      subdomain: normalizedSubdomain,
      portfolioConfig,
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
    console.error("Error during onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
