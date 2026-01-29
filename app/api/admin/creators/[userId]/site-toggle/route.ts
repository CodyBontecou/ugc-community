import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { addDomain, removeDomain, VercelApiError } from "@/lib/vercel";

const siteToggleSchema = z.object({
  enabled: z.boolean(),
});

// POST /api/admin/creators/[userId]/site-toggle - Enable/disable creator subdomain hosting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { enabled } = siteToggleSchema.parse(body);

    // Get user with required fields
    const userResult = await db
      .select({
        id: users.id,
        subdomain: users.subdomain,
        vercelProjectId: users.vercelProjectId,
        siteEnabled: users.siteEnabled,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult[0];

    // Validate required fields
    if (!user.vercelProjectId) {
      return NextResponse.json(
        { error: "User does not have a Vercel project ID configured" },
        { status: 400 }
      );
    }

    if (!user.subdomain) {
      return NextResponse.json(
        { error: "User does not have a subdomain configured" },
        { status: 400 }
      );
    }

    const domain = `${user.subdomain}.ugc.community`;

    // Toggle domain based on enabled flag
    if (enabled) {
      // Add domain to Vercel project
      await addDomain(user.vercelProjectId, domain);
    } else {
      // Remove domain from Vercel project
      await removeDomain(user.vercelProjectId, domain);
    }

    // Update user's siteEnabled field
    const [updated] = await db
      .update(users)
      .set({
        siteEnabled: enabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        siteEnabled: users.siteEnabled,
      });

    return NextResponse.json({
      success: true,
      siteEnabled: updated.siteEnabled,
      domain,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof VercelApiError) {
      return NextResponse.json(
        { error: `Vercel API error: ${error.message}` },
        { status: error.statusCode >= 500 ? 502 : 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error toggling site:", error);
    return NextResponse.json({ error: "Failed to toggle site" }, { status: 500 });
  }
}
