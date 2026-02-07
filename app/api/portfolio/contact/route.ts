import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, contactSubmissions } from "@/lib/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { sendContactInquiry, sendContactConfirmation } from "@/lib/email";
import { checkBotId } from "botid/server";
import { createHash } from "crypto";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(1, "Company name is required").max(100),
  message: z.string().min(1, "Project details are required").max(5000),
  creatorSubdomain: z.string().min(1, "Creator subdomain is required"),
});

const EMAIL_RATE_LIMIT_WINDOW_MINUTES = 60;
const EMAIL_RATE_LIMIT_MAX_SUBMISSIONS = 3;
const IP_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const IP_RATE_LIMIT_MAX_SUBMISSIONS = 10;

const inMemoryIpLimiter = new Map<string, number[]>();

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // Allow requests from any *.ugc.community subdomain
  if (/^https?:\/\/([a-z0-9-]+\.)?ugc\.community$/i.test(origin)) {
    return true;
  }

  // For development, also allow localhost
  return /^https?:\/\/localhost(:\d+)?$/i.test(origin);
}

function isAllowedReferer(referer: string | null): boolean {
  if (!referer) return false;

  try {
    const parsed = new URL(referer);
    return isAllowedOrigin(`${parsed.protocol}//${parsed.host}`);
  } catch {
    return false;
  }
}

function extractSubdomainFromOrigin(origin: string | null): string | null {
  if (!origin) return null;

  const match = origin.match(/^https?:\/\/([a-z0-9-]+)\.ugc\.community$/i);
  if (!match) return null;

  return match[1].toLowerCase();
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function isInMemoryIpRateLimited(key: string): boolean {
  const now = Date.now();
  const cutoff = now - IP_RATE_LIMIT_WINDOW_MS;

  const recentHits = (inMemoryIpLimiter.get(key) || []).filter((timestamp) => timestamp >= cutoff);
  recentHits.push(now);
  inMemoryIpLimiter.set(key, recentHits);

  // Basic periodic cleanup to avoid unbounded growth
  if (inMemoryIpLimiter.size > 5000) {
    for (const [entryKey, timestamps] of inMemoryIpLimiter) {
      const active = timestamps.filter((timestamp) => timestamp >= cutoff);
      if (active.length === 0) {
        inMemoryIpLimiter.delete(entryKey);
      } else {
        inMemoryIpLimiter.set(entryKey, active);
      }
    }
  }

  return recentHits.length > IP_RATE_LIMIT_MAX_SUBMISSIONS;
}

async function isEmailRateLimited(creatorId: string, senderEmail: string): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - EMAIL_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactSubmissions)
    .where(
      and(
        eq(contactSubmissions.creatorId, creatorId),
        eq(contactSubmissions.senderEmail, senderEmail),
        gte(contactSubmissions.createdAt, windowStart)
      )
    );

  return Number(result?.count || 0) >= EMAIL_RATE_LIMIT_MAX_SUBMISSIONS;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");
  const corsHeaders = getCorsHeaders(origin);

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { error: "Invalid origin" },
      { status: 403, headers: corsHeaders }
    );
  }

  const hasFetchMetadata = secFetchSite !== null;
  const isSameSiteBrowserRequest =
    !hasFetchMetadata || secFetchSite === "same-site" || secFetchSite === "same-origin";

  // Portfolio pages are served from static Blob HTML, so BotID client signals
  // are not always available. Keep BotID enabled, but allow trusted same-site
  // browser submissions from ugc.community origins as a fallback.
  const isTrustedPortfolioSubmission =
    isAllowedOrigin(origin) &&
    (!referer || isAllowedReferer(referer)) &&
    isSameSiteBrowserRequest;

  const verification = await checkBotId();
  if (verification.isBot && !isTrustedPortfolioSubmission) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403, headers: corsHeaders }
    );
  }

  if (verification.isBot && isTrustedPortfolioSubmission) {
    console.warn("Allowing BotID-blocked request via trusted portfolio fallback", {
      origin,
      referer,
      secFetchSite,
    });
  }

  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    const normalized = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      company: data.company.trim(),
      message: data.message.trim(),
      creatorSubdomain: data.creatorSubdomain.trim().toLowerCase(),
    };

    const originSubdomain = extractSubdomainFromOrigin(origin);
    if (originSubdomain && originSubdomain !== normalized.creatorSubdomain) {
      return NextResponse.json(
        { error: "Invalid creator subdomain" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Look up creator by subdomain
    const creator = await db.query.users.findFirst({
      where: eq(users.subdomain, normalized.creatorSubdomain),
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const emailLimited = await isEmailRateLimited(creator.id, normalized.email);
    if (emailLimited) {
      return NextResponse.json(
        { error: "Too many messages sent recently. Please try again later." },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(EMAIL_RATE_LIMIT_WINDOW_MINUTES * 60),
          },
        }
      );
    }

    const clientIpHash = hashIp(getClientIp(request));
    const ipLimitKey = `${creator.id}:${clientIpHash}`;
    if (isInMemoryIpRateLimited(ipLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(Math.floor(IP_RATE_LIMIT_WINDOW_MS / 1000)),
          },
        }
      );
    }

    const portfolioUrl = `https://${normalized.creatorSubdomain}.ugc.community`;

    // Insert submission record
    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        creatorId: creator.id,
        senderName: normalized.name,
        senderEmail: normalized.email,
        senderCompany: normalized.company,
        message: normalized.message,
        emailSentToCreator: false,
        emailSentToSender: false,
      })
      .returning({ id: contactSubmissions.id });

    console.log(`Contact submission ${submission.id} created for creator ${creator.id}`);

    let emailSentToCreator = false;
    let emailSentToSender = false;

    // Send email to creator
    try {
      await sendContactInquiry({
        creatorName: creator.displayName || creator.name,
        creatorEmail: creator.email,
        senderName: normalized.name,
        senderEmail: normalized.email,
        company: normalized.company,
        message: normalized.message,
        portfolioUrl,
      });
      emailSentToCreator = true;
    } catch (emailError) {
      console.error("Failed to send contact inquiry to creator:", emailError);
      // Continue anyway - we still want to send confirmation
    }

    // Send confirmation to the person who submitted
    try {
      await sendContactConfirmation({
        senderName: normalized.name,
        senderEmail: normalized.email,
        creatorName: creator.displayName || creator.name,
        portfolioUrl,
      });
      emailSentToSender = true;
    } catch (emailError) {
      console.error("Failed to send contact confirmation:", emailError);
    }

    // Update submission with email delivery status
    await db
      .update(contactSubmissions)
      .set({ emailSentToCreator, emailSentToSender })
      .where(eq(contactSubmissions.id, submission.id));

    return NextResponse.json(
      { success: true, message: "Message sent successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
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
