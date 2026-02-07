import { db } from "@/lib/db";
import { users, posts } from "@/lib/db/schema";
import { and, eq, sql, notInArray, inArray } from "drizzle-orm";

/**
 * Get list of admin emails from environment variable
 */
function getAdminEmails(): string[] {
  return (
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ||
    []
  );
}

export interface CreatorTableRow {
  id: string;
  name: string;
  displayName: string | null;
  image: string | null;
  subdomain: string;
  // Platforms
  instagramHandles: string[] | null;
  tiktokHandles: string[] | null;
  youtubeHandles: string[] | null;
  // Profile
  niches: string[] | null;
  locationCity: string | null;
  locationCountry: string | null;
  tagline: string | null;
  rateRange: string | null;
  availableForHire: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  isBoosted: boolean;
  // Stats
  portfolioViewCount: number;
  // Dates (serialized as ISO strings for client component)
  directoryJoinedAt: string | null;
  createdAt: string;
  lastScrapedAt: string | null;
  // Post aggregates
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  firstPostDate: string | null;
  lastPostDate: string | null;
}

export async function getCreatorsForTable(): Promise<CreatorTableRow[]> {
  const adminEmails = getAdminEmails();

  const conditions: ReturnType<typeof eq>[] = [
    sql`${users.subdomain} IS NOT NULL` as any,
    eq(users.siteEnabled, true),
    eq(users.status, "active"),
  ];

  if (adminEmails.length > 0) {
    conditions.push(notInArray(users.email, adminEmails) as any);
  }

  const creatorsResult = await db
    .select({
      id: users.id,
      name: users.name,
      displayName: users.displayName,
      image: users.image,
      subdomain: users.subdomain,
      instagramHandles: users.instagramHandles,
      tiktokHandles: users.tiktokHandles,
      youtubeHandles: users.youtubeHandles,
      niches: users.niches,
      locationCity: users.locationCity,
      locationCountry: users.locationCountry,
      tagline: users.tagline,
      rateRange: users.rateRange,
      availableForHire: users.availableForHire,
      isVerified: users.isVerified,
      isFeatured: users.isFeatured,
      hideBadges: users.hideBadges,
      directoryBoostUntil: users.directoryBoostUntil,
      portfolioViewCount: users.portfolioViewCount,
      directoryJoinedAt: users.directoryJoinedAt,
      createdAt: users.createdAt,
      lastScrapedAt: users.lastScrapedAt,
    })
    .from(users)
    .where(and(...conditions));

  const validCreators = creatorsResult.filter((c) => c.subdomain !== null);

  if (validCreators.length === 0) return [];

  const userIds = validCreators.map((c) => c.id);

  // Aggregate post stats per creator
  let postStats: {
    userId: string;
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    firstPostDate: Date | null;
    lastPostDate: Date | null;
  }[] = [];

  try {
    postStats = await db
      .select({
        userId: posts.userId,
        totalPosts: sql<number>`cast(count(*) as integer)`,
        totalViews: sql<number>`cast(coalesce(sum(cast(${posts.metadata}->>'views' as integer)), 0) as integer)`,
        totalLikes: sql<number>`cast(coalesce(sum(cast(${posts.metadata}->>'likes' as integer)), 0) as integer)`,
        totalComments: sql<number>`cast(coalesce(sum(cast(${posts.metadata}->>'comments' as integer)), 0) as integer)`,
        totalShares: sql<number>`cast(coalesce(sum(cast(${posts.metadata}->>'shares' as integer)), 0) as integer)`,
        firstPostDate: sql<Date | null>`min(${posts.postedAt})`,
        lastPostDate: sql<Date | null>`max(${posts.postedAt})`,
      })
      .from(posts)
      .where(inArray(posts.userId, userIds))
      .groupBy(posts.userId);
  } catch (err) {
    console.error("Failed to aggregate post stats:", err);
  }

  const statsMap = new Map(postStats.map((s) => [s.userId, s]));
  const now = new Date();

  return validCreators.map((c) => {
    const stats = statsMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      image: c.image,
      subdomain: c.subdomain as string,
      instagramHandles: c.instagramHandles,
      tiktokHandles: c.tiktokHandles,
      youtubeHandles: c.youtubeHandles,
      niches: c.niches,
      locationCity: c.locationCity,
      locationCountry: c.locationCountry,
      tagline: c.tagline,
      rateRange: c.rateRange,
      availableForHire: c.availableForHire,
      isVerified: c.hideBadges ? false : c.isVerified,
      isFeatured: c.isFeatured,
      isBoosted:
        c.isFeatured ||
        (c.directoryBoostUntil !== null && c.directoryBoostUntil > now),
      portfolioViewCount: c.portfolioViewCount,
      directoryJoinedAt: c.directoryJoinedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      lastScrapedAt: c.lastScrapedAt?.toISOString() ?? null,
      totalPosts: stats?.totalPosts ?? 0,
      totalViews: stats?.totalViews ?? 0,
      totalLikes: stats?.totalLikes ?? 0,
      totalComments: stats?.totalComments ?? 0,
      totalShares: stats?.totalShares ?? 0,
      firstPostDate: stats?.firstPostDate?.toISOString() ?? null,
      lastPostDate: stats?.lastPostDate?.toISOString() ?? null,
    };
  });
}
