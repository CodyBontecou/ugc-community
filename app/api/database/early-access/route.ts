import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";

const signup = z.object({ email: z.string().trim().email().max(254).transform(value => value.toLowerCase()) });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  let payload: unknown;
  try {
    const body = await request.text();
    if (body.length > 2048) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = signup.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  try {
    await getDb().insert(waitlist).values({ email: result.data.email, userType: "brand" }).onConflictDoNothing({ target: waitlist.email });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Database early-access signup could not be saved");
    return NextResponse.json({ error: "Signup unavailable" }, { status: 503 });
  }
}
