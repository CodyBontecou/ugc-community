import { NextResponse } from "next/server";
import { getActiveTemplates } from "@/lib/templates/queries";

export async function GET() {
  try {
    const templates = await getActiveTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
