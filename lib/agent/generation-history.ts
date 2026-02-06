// =====================================================
// Generation History & Avoidance
// =====================================================

import { db } from "@/lib/db";
import { portfolioGenerations } from "@/lib/db/schema";
import { desc, eq, isNotNull } from "drizzle-orm";

export interface RecentDesignChoices {
  seedIds: string[];
  fonts: string[];
  colors: string[];
}

/**
 * Queries recent completed generations for their design metadata.
 */
export async function getRecentDesignChoices(
  limit: number = 10
): Promise<RecentDesignChoices> {
  try {
    const recent = await db
      .select({
        designSeedId: portfolioGenerations.designSeedId,
        fontsUsed: portfolioGenerations.fontsUsed,
        primaryColors: portfolioGenerations.primaryColors,
      })
      .from(portfolioGenerations)
      .where(eq(portfolioGenerations.status, "completed"))
      .orderBy(desc(portfolioGenerations.completedAt))
      .limit(limit);

    const seedIds = new Set<string>();
    const fonts = new Set<string>();
    const colors = new Set<string>();

    for (const row of recent) {
      if (row.designSeedId) seedIds.add(row.designSeedId);
      if (row.fontsUsed) {
        for (const font of row.fontsUsed) {
          fonts.add(font);
        }
      }
      if (row.primaryColors) {
        for (const color of row.primaryColors) {
          colors.add(color);
        }
      }
    }

    return {
      seedIds: Array.from(seedIds),
      fonts: Array.from(fonts),
      colors: Array.from(colors),
    };
  } catch (error) {
    console.error("Failed to load recent design choices:", error);
    return { seedIds: [], fonts: [], colors: [] };
  }
}

/**
 * Builds a markdown section instructing Claude to avoid recent choices.
 */
export function buildAvoidancePrompt(recent: RecentDesignChoices): string {
  const parts: string[] = [];

  if (recent.fonts.length > 0) {
    parts.push(
      `These fonts were used in recent portfolios — do NOT use them: ${recent.fonts.join(", ")}`
    );
  }

  if (recent.colors.length > 0) {
    // Only show a reasonable number of colors
    const colorSample = recent.colors.slice(0, 12);
    parts.push(
      `These color schemes were used recently — choose something distinctly different: ${colorSample.join(", ")}`
    );
  }

  if (parts.length === 0) return "";

  return `## Avoid These Recent Choices\n\n${parts.join("\n\n")}`;
}
