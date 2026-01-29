import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendContactInquiry, sendContactConfirmation } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(1, "Company name is required").max(100),
  message: z.string().min(1, "Project details are required").max(5000),
  creatorSubdomain: z.string().min(1, "Creator subdomain is required"),
});

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Allow requests from any *.ugc.community subdomain
  const allowedOriginPattern = /^https?:\/\/([a-z0-9-]+\.)?ugc\.community$/i;

  if (origin && allowedOriginPattern.test(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  // For development, also allow localhost
  if (origin && /^https?:\/\/localhost(:\d+)?$/i.test(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  return {};
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Look up creator by subdomain
    const creator = await db.query.users.findFirst({
      where: eq(users.subdomain, data.creatorSubdomain.toLowerCase()),
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const portfolioUrl = `https://${data.creatorSubdomain}.ugc.community`;

    // Send email to creator
    try {
      await sendContactInquiry({
        creatorName: creator.displayName || creator.name,
        creatorEmail: creator.email,
        senderName: data.name,
        senderEmail: data.email,
        company: data.company,
        message: data.message,
        portfolioUrl,
      });
    } catch (emailError) {
      console.error("Failed to send contact inquiry to creator:", emailError);
      // Continue anyway - we still want to send confirmation
    }

    // Send confirmation to the person who submitted
    try {
      await sendContactConfirmation({
        senderName: data.name,
        senderEmail: data.email,
        creatorName: creator.displayName || creator.name,
        portfolioUrl,
      });
    } catch (emailError) {
      console.error("Failed to send contact confirmation:", emailError);
    }

    return NextResponse.json(
      { success: true, message: "Message sent successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid input" },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}
