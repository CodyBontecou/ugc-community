import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  onboardingQuestionnaires,
  users,
  SocialMediaHandle,
  BrandPartnership,
  VideoEntry,
  ImageEntry,
} from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  validateSubdomain,
  generateSubdomainSuggestions,
} from "@/lib/validation/subdomain";

const socialMediaHandleSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "twitter", "linkedin", "other"]),
  handle: z.string().min(1, "Handle is required").max(200),
});

const brandPartnershipSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["paid", "gifted", "ambassador", "affiliate", "collaboration"]),
});

const videoEntrySchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().min(1).max(200),
  platform: z.enum(["tiktok", "instagram", "youtube"]),
});

const imageEntrySchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().max(200).optional().default(""),
  category: z.string().max(100).optional().default(""),
});

const submitQuestionnaireSchema = z.object({
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters"),
  
  // Basic info
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  niche: z.string().min(1, "Please select a niche"),
  tagline: z.string().max(100).optional().default(""),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(1000),
  location: z.string().max(200).optional().default(""),
  
  // Social & content
  socialMediaHandles: z.array(socialMediaHandleSchema).min(1, "Please add at least one social media handle").max(20),
  brandPartnerships: z.array(brandPartnershipSchema).max(50).optional().default([]),
  videos: z.array(videoEntrySchema).max(20).optional().default([]),
  images: z.array(imageEntrySchema).max(50).optional().default([]),
  selectedServices: z.array(z.string()).min(1, "Please select at least one service").max(20),
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
        socialMediaHandles: existing.socialMediaHandles || [],
        brandPartnerships: existing.brandPartnerships || [],
        videos: existing.videos || [],
        images: existing.images || [],
        selectedServices: existing.selectedServices || [],
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

    // Get user info
    const [user] = await db
      .select({
        subdomain: users.subdomain,
        name: users.name,
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

    // Prepare data for insert/update
    const questionnaireData = {
      name: validated.name,
      email: validated.email,
      niche: validated.niche,
      tagline: validated.tagline || null,
      bio: validated.bio,
      location: validated.location || null,
      socialMediaHandles: validated.socialMediaHandles as SocialMediaHandle[],
      brandPartnerships: validated.brandPartnerships as BrandPartnership[],
      videos: validated.videos as VideoEntry[],
      images: validated.images as ImageEntry[],
      selectedServices: validated.selectedServices,
      updatedAt: new Date(),
    };

    if (existing) {
      // Update existing questionnaire
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
        .set(questionnaireData)
        .where(eq(onboardingQuestionnaires.userId, session.user.id))
        .returning();

      return NextResponse.json({
        message: "Media kit updated",
        questionnaire: {
          ...updated,
          socialMediaHandles: updated.socialMediaHandles || [],
          brandPartnerships: updated.brandPartnerships || [],
          videos: updated.videos || [],
          images: updated.images || [],
          selectedServices: updated.selectedServices || [],
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

    // Create new questionnaire
    const [created] = await db
      .insert(onboardingQuestionnaires)
      .values({
        userId: session.user.id,
        ...questionnaireData,
      })
      .returning();

    return NextResponse.json({
      message: "Media kit created successfully!",
      questionnaire: {
        ...created,
        socialMediaHandles: created.socialMediaHandles || [],
        brandPartnerships: created.brandPartnerships || [],
        videos: created.videos || [],
        images: created.images || [],
        selectedServices: created.selectedServices || [],
      },
      subdomain: normalizedSubdomain,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to submit: ${errorMessage}` },
      { status: 500 }
    );
  }
}
