import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { sendWaitlistConfirmation, sendWaitlistNotification } from "@/lib/email";
import { checkBotId } from "botid/server";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  userType: z.enum(["creator", "brand"]).default("creator"),
  instagramHandle: z.string().optional().transform((v) => v?.trim() || null),
  tiktokHandle: z.string().optional().transform((v) => v?.trim() || null),
  youtubeHandle: z.string().optional().transform((v) => v?.trim() || null),
  facebookHandle: z.string().optional().transform((v) => v?.trim() || null),
  twitterHandle: z.string().optional().transform((v) => v?.trim() || null),
});

export async function POST(request: NextRequest) {
  // Bot protection via Vercel BotID
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = waitlistSchema.parse(body);

    // Insert into waitlist
    await db
      .insert(waitlist)
      .values({
        email: data.email.toLowerCase(),
        userType: data.userType,
        instagramHandle: data.instagramHandle,
        tiktokHandle: data.tiktokHandle,
        youtubeHandle: data.youtubeHandle,
        facebookHandle: data.facebookHandle,
        twitterHandle: data.twitterHandle,
      })
      .onConflictDoUpdate({
        target: waitlist.email,
        set: {
          userType: data.userType,
          instagramHandle: data.instagramHandle,
          tiktokHandle: data.tiktokHandle,
          youtubeHandle: data.youtubeHandle,
          facebookHandle: data.facebookHandle,
          twitterHandle: data.twitterHandle,
        },
      });

    // Send confirmation email
    try {
      await sendWaitlistConfirmation(data.email);
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Failed to send confirmation email:", emailError);
    }

    // Send notification email to admin
    try {
      await sendWaitlistNotification({
        email: data.email.toLowerCase(),
        userType: data.userType,
        instagramHandle: data.instagramHandle,
        tiktokHandle: data.tiktokHandle,
        youtubeHandle: data.youtubeHandle,
        facebookHandle: data.facebookHandle,
        twitterHandle: data.twitterHandle,
      });
    } catch (notifyError) {
      console.error("Failed to send waitlist notification:", notifyError);
    }

    return NextResponse.json({
      success: true,
      message: "You're on the waitlist!",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Waitlist submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
