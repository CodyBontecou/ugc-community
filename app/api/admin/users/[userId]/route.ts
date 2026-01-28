import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin, type UserStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
});

// PATCH /api/admin/users/[userId] - Update user status
export async function PATCH(
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
    const { status } = updateUserStatusSchema.parse(body);

    // Prevent admin from changing their own status
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own status" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent changing status of other admins
    if (isAdmin(existingUser[0].email)) {
      return NextResponse.json(
        { error: "Cannot change status of admin users" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(users)
      .set({
        status: status as UserStatus,
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        statusChangedAt: users.statusChangedAt,
      });

    return NextResponse.json({ user: updated });
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
    console.error("Error updating user status:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
