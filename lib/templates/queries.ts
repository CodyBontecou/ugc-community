/**
 * Portfolio Template Queries
 *
 * Database queries for fetching portfolio data needed for template rendering.
 */

import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  portfolioConfigs,
  templates,
  portfolioProjects,
  portfolioProjectMedia,
  media,
  users,
} from "@/lib/db/schema";
import type { User, PortfolioConfig, Template, PortfolioProject, Media } from "@/lib/db/schema";

// =====================================================
// Types
// =====================================================

export interface PortfolioData {
  user: User;
  config: PortfolioConfig;
  template: Template;
  projects: PortfolioProject[];
  /** Map of projectId -> cover media */
  projectCoverMedia: Map<string, Media>;
  /** Map of mediaId -> media (for section content) */
  mediaMap: Map<string, Media>;
}

// =====================================================
// Main Query
// =====================================================

/**
 * Fetch all data needed to render a user's portfolio
 *
 * @param userId - The user ID to fetch portfolio for
 * @param options.includeUnpublished - Include unpublished portfolios (for owner preview)
 * @returns Portfolio data or null if no portfolio exists
 */
export async function getPortfolioData(
  userId: string,
  options?: { includeUnpublished?: boolean }
): Promise<PortfolioData | null> {
  // Fetch portfolio config with template
  const configResult = await db.query.portfolioConfigs.findFirst({
    where: options?.includeUnpublished
      ? eq(portfolioConfigs.userId, userId)
      : and(
          eq(portfolioConfigs.userId, userId),
          eq(portfolioConfigs.isPublished, true)
        ),
    with: {
      template: true,
      user: true,
    },
  });

  if (!configResult || !configResult.template) {
    return null;
  }

  const { template, user, ...config } = configResult;

  // Fetch portfolio projects ordered by displayOrder
  const projectsResult = await db.query.portfolioProjects.findMany({
    where: eq(portfolioProjects.userId, userId),
    orderBy: [asc(portfolioProjects.displayOrder)],
  });

  // Fetch cover media for each project
  const projectCoverMedia = new Map<string, Media>();
  if (projectsResult.length > 0) {
    const projectIds = projectsResult.map((p) => p.id);

    // Get cover media (isCover = true) for all projects
    const coverMediaResults = await db
      .select({
        projectId: portfolioProjectMedia.projectId,
        media: media,
      })
      .from(portfolioProjectMedia)
      .innerJoin(media, eq(portfolioProjectMedia.mediaId, media.id))
      .where(
        and(
          eq(portfolioProjectMedia.isCover, true),
          // Filter to our project IDs
          // Note: drizzle doesn't have inArray in this context, so we'll filter after
        )
      );

    // Filter and map results
    const projectIdSet = new Set(projectIds);
    for (const result of coverMediaResults) {
      if (projectIdSet.has(result.projectId)) {
        projectCoverMedia.set(result.projectId, result.media);
      }
    }

    // For projects without explicit cover, use first media
    for (const project of projectsResult) {
      if (!projectCoverMedia.has(project.id)) {
        const firstMedia = await db
          .select({ media: media })
          .from(portfolioProjectMedia)
          .innerJoin(media, eq(portfolioProjectMedia.mediaId, media.id))
          .where(eq(portfolioProjectMedia.projectId, project.id))
          .orderBy(asc(portfolioProjectMedia.displayOrder))
          .limit(1);

        if (firstMedia[0]) {
          projectCoverMedia.set(project.id, firstMedia[0].media);
        }
      }
    }
  }

  // Build media map for section content (hero backgrounds, about profile, etc.)
  const mediaMap = new Map<string, Media>();

  // Collect media IDs referenced in section content
  const mediaIdsToFetch = new Set<string>();

  const sections = config.sections;
  if (sections) {
    // Check hero
    if (sections.hero?.content?.backgroundMediaId) {
      mediaIdsToFetch.add(sections.hero.content.backgroundMediaId);
    }
    // Check about
    if (sections.about?.content?.profileMediaId) {
      mediaIdsToFetch.add(sections.about.content.profileMediaId);
    }
    // Check testimonials for avatars
    if (sections.testimonials?.content?.testimonials) {
      for (const t of sections.testimonials.content.testimonials) {
        if (t.avatarMediaId) {
          mediaIdsToFetch.add(t.avatarMediaId);
        }
      }
    }
  }

  // Fetch all needed media
  if (mediaIdsToFetch.size > 0) {
    const mediaResults = await db.query.media.findMany({
      where: (m, { inArray }) => inArray(m.id, Array.from(mediaIdsToFetch)),
    });

    for (const m of mediaResults) {
      mediaMap.set(m.id, m);
    }
  }

  return {
    user,
    config,
    template,
    projects: projectsResult,
    projectCoverMedia,
    mediaMap,
  };
}

/**
 * Fetch portfolio data by subdomain
 */
export async function getPortfolioDataBySubdomain(
  subdomain: string,
  options?: { includeUnpublished?: boolean }
): Promise<PortfolioData | null> {
  // First find the user by subdomain
  const user = await db.query.users.findFirst({
    where: eq(users.subdomain, subdomain.toLowerCase()),
  });

  if (!user) {
    return null;
  }

  return getPortfolioData(user.id, options);
}

/**
 * Check if a user has a published portfolio
 */
export async function hasPublishedPortfolio(userId: string): Promise<boolean> {
  const config = await db.query.portfolioConfigs.findFirst({
    where: and(
      eq(portfolioConfigs.userId, userId),
      eq(portfolioConfigs.isPublished, true)
    ),
    columns: { id: true },
  });

  return !!config;
}

// =====================================================
// Editor Queries
// =====================================================

/**
 * Get all active templates
 */
export async function getActiveTemplates(): Promise<Template[]> {
  return db.query.templates.findMany({
    where: eq(templates.isActive, true),
  });
}

/**
 * Get a single template by slug
 */
export async function getTemplateBySlug(slug: string): Promise<Template | null> {
  const template = await db.query.templates.findFirst({
    where: eq(templates.slug, slug),
  });
  return template ?? null;
}

/**
 * Get user's portfolio config (with template)
 */
export async function getUserPortfolioConfig(userId: string): Promise<(PortfolioConfig & { template: Template | null }) | null> {
  const config = await db.query.portfolioConfigs.findFirst({
    where: eq(portfolioConfigs.userId, userId),
    with: {
      template: true,
    },
  });
  return config ?? null;
}

/**
 * Create or update portfolio config with selected template
 */
export async function selectTemplate(userId: string, templateId: string): Promise<PortfolioConfig> {
  // Check if user already has a config
  const existing = await db.query.portfolioConfigs.findFirst({
    where: eq(portfolioConfigs.userId, userId),
  });

  // Get template defaults
  const template = await db.query.templates.findFirst({
    where: eq(templates.id, templateId),
  });

  if (!template) {
    throw new Error("Template not found");
  }

  if (existing) {
    // Update existing config
    const [updated] = await db
      .update(portfolioConfigs)
      .set({
        templateId,
        sections: template.sectionDefaults ?? {},
        updatedAt: new Date(),
      })
      .where(eq(portfolioConfigs.id, existing.id))
      .returning();
    return updated;
  } else {
    // Create new config
    const [created] = await db
      .insert(portfolioConfigs)
      .values({
        userId,
        templateId,
        sections: template.sectionDefaults ?? {},
      })
      .returning();
    return created;
  }
}

/**
 * Update portfolio sections
 */
export async function updatePortfolioSections(
  userId: string,
  sections: PortfolioConfig["sections"]
): Promise<PortfolioConfig> {
  const [updated] = await db
    .update(portfolioConfigs)
    .set({
      sections,
      updatedAt: new Date(),
    })
    .where(eq(portfolioConfigs.userId, userId))
    .returning();
  
  if (!updated) {
    throw new Error("Portfolio config not found");
  }
  
  return updated;
}

/**
 * Update portfolio theme
 */
export async function updatePortfolioTheme(
  userId: string,
  theme: PortfolioConfig["theme"]
): Promise<PortfolioConfig> {
  const [updated] = await db
    .update(portfolioConfigs)
    .set({
      theme,
      updatedAt: new Date(),
    })
    .where(eq(portfolioConfigs.userId, userId))
    .returning();
  
  if (!updated) {
    throw new Error("Portfolio config not found");
  }
  
  return updated;
}

/**
 * Publish or unpublish portfolio
 */
export async function setPortfolioPublished(
  userId: string,
  isPublished: boolean
): Promise<PortfolioConfig> {
  const [updated] = await db
    .update(portfolioConfigs)
    .set({
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(portfolioConfigs.userId, userId))
    .returning();
  
  if (!updated) {
    throw new Error("Portfolio config not found");
  }
  
  return updated;
}

/**
 * Update SEO settings
 */
export async function updatePortfolioSeo(
  userId: string,
  seo: PortfolioConfig["seo"]
): Promise<PortfolioConfig> {
  const [updated] = await db
    .update(portfolioConfigs)
    .set({
      seo,
      updatedAt: new Date(),
    })
    .where(eq(portfolioConfigs.userId, userId))
    .returning();
  
  if (!updated) {
    throw new Error("Portfolio config not found");
  }
  
  return updated;
}
