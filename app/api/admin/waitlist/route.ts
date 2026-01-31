import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { waitlist, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const createWaitlistSchema = z.object({
  email: z.string().email(),
  userType: z.enum(["creator", "brand"]).default("creator"),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  youtubeHandle: z.string().optional(),
  facebookHandle: z.string().optional(),
  twitterHandle: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const entries = await db
      .select({
        id: waitlist.id,
        email: waitlist.email,
        instagramHandle: waitlist.instagramHandle,
        tiktokHandle: waitlist.tiktokHandle,
        youtubeHandle: waitlist.youtubeHandle,
        facebookHandle: waitlist.facebookHandle,
        twitterHandle: waitlist.twitterHandle,
        createdAt: waitlist.createdAt,
        invitedAt: waitlist.invitedAt,
        invitedBy: waitlist.invitedBy,
      })
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt));

    // Fetch inviter details for entries that have been invited
    const entriesWithInviters = await Promise.all(
      entries.map(async (entry) => {
        let inviter = null;
        if (entry.invitedBy) {
          const [user] = await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, entry.invitedBy))
            .limit(1);
          inviter = user || null;
        }
        return {
          ...entry,
          inviter,
        };
      })
    );

    return NextResponse.json({ waitlist: entriesWithInviters });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error listing waitlist:", error);
    return NextResponse.json({ error: "Failed to list waitlist" }, { status: 500 });
  }
}

// POST /api/admin/waitlist - Create a new waitlist entry (admin-initiated)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const data = createWaitlistSchema.parse(body);

    // Check if email already exists
    const existing = await db.query.waitlist.findFirst({
      where: eq(waitlist.email, data.email.toLowerCase()),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists in waitlist" },
        { status: 409 }
      );
    }

    // Also check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const [entry] = await db
      .insert(waitlist)
      .values({
        email: data.email.toLowerCase(),
        userType: data.userType,
        instagramHandle: data.instagramHandle?.trim() || null,
        tiktokHandle: data.tiktokHandle?.trim() || null,
        youtubeHandle: data.youtubeHandle?.trim() || null,
        facebookHandle: data.facebookHandle?.trim() || null,
        twitterHandle: data.twitterHandle?.trim() || null,
      })
      .returning();

    return NextResponse.json({
      entry: {
        id: entry.id,
        email: entry.email,
        userType: entry.userType,
        instagramHandle: entry.instagramHandle,
        tiktokHandle: entry.tiktokHandle,
        youtubeHandle: entry.youtubeHandle,
        facebookHandle: entry.facebookHandle,
        twitterHandle: entry.twitterHandle,
        createdAt: entry.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating waitlist entry:", error);
    return NextResponse.json({ error: "Failed to create waitlist entry" }, { status: 500 });
  }
}
