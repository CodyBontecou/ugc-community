import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin, type UserStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { validateSubdomain } from "@/lib/validation/subdomain";

const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]),
});

const updateUserSubdomainSchema = z.object({
  subdomain: z.string().nullable(),
});

// PATCH /api/admin/users/[userId] - Update user status or subdomain
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

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id, email: users.email, subdomain: users.subdomain })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle subdomain update
    if ("subdomain" in body) {
      const { subdomain } = updateUserSubdomainSchema.parse(body);

      if (subdomain === null || subdomain === "") {
        // Clear subdomain
        const [updated] = await db
          .update(users)
          .set({
            subdomain: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            subdomain: users.subdomain,
          });

        return NextResponse.json({ user: updated });
      }

      // Validate subdomain
      const validation = validateSubdomain(subdomain);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Check if subdomain is already taken by another user
      const existingSubdomain = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.subdomain, validation.normalized!), ne(users.id, userId)))
        .limit(1);

      if (existingSubdomain.length > 0) {
        return NextResponse.json(
          { error: "This subdomain is already taken" },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(users)
        .set({
          subdomain: validation.normalized,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          subdomain: users.subdomain,
        });

      return NextResponse.json({ user: updated });
    }

    // Handle status update
    const { status } = updateUserStatusSchema.parse(body);

    // Prevent admin from changing their own status
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own status" },
        { status: 400 }
      );
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
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
