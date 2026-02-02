/**
 * Portfolio Preview API
 *
 * Returns the current user's portfolio data for client-side preview rendering.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getPortfolioData } from "@/lib/templates/queries";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolioData = await getPortfolioData(session.user.id, {
      includeUnpublished: true,
    });

    if (!portfolioData) {
      return NextResponse.json({ error: "No portfolio found" }, { status: 404 });
    }

    // Convert Maps to objects for JSON serialization
    const projectCoverMedia: Record<string, typeof portfolioData.projectCoverMedia extends Map<string, infer V> ? V : never> = {};
    for (const [key, value] of portfolioData.projectCoverMedia) {
      projectCoverMedia[key] = value;
    }

    const mediaMap: Record<string, typeof portfolioData.mediaMap extends Map<string, infer V> ? V : never> = {};
    for (const [key, value] of portfolioData.mediaMap) {
      mediaMap[key] = value;
    }

    // Build projects with cover media
    const projectsWithMedia = portfolioData.projects.map((project) => ({
      ...project,
      coverMedia: projectCoverMedia[project.id] ?? null,
    }));

    return NextResponse.json({
      user: portfolioData.user,
      config: portfolioData.config,
      template: portfolioData.template,
      projects: projectsWithMedia,
      mediaMap,
    });
  } catch (error) {
    console.error("Error fetching portfolio preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio preview" },
      { status: 500 }
    );
  }
}
