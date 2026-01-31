import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/notifications/queries";

// GET /api/user/settings - Get user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserNotificationPreferences(session.user.id);

    if (!preferences) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH /api/user/settings - Update user's notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emailOnJobApplication, emailOnApplicationUpdate } = body;

    const updates: {
      emailOnJobApplication?: boolean;
      emailOnApplicationUpdate?: boolean;
    } = {};

    if (typeof emailOnJobApplication === "boolean") {
      updates.emailOnJobApplication = emailOnJobApplication;
    }

    if (typeof emailOnApplicationUpdate === "boolean") {
      updates.emailOnApplicationUpdate = emailOnApplicationUpdate;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const preferences = await updateUserNotificationPreferences(session.user.id, updates);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
