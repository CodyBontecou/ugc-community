import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, desc, asc, sql, ilike, arrayOverlaps, or, gte, notInArray } from "drizzle-orm";
import {
  type Niche,
  type RateRange,
  type SortOption,
  DEFAULT_PAGE_SIZE,
} from "./constants";

/**
 * Get list of admin emails from environment variable
 * Used to exclude admins from the creator directory
 */
function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];
}

export interface DirectoryFilters {
  niches?: Niche[];
  location?: string;
  rateRange?: RateRange;
  availableForHire?: boolean;
  showAll?: boolean; // When true, show all creators with subdomains (not just directoryListed)
}

export interface DirectorySort {
  sort?: SortOption;
}

export interface DirectoryPagination {
  page?: number;
  pageSize?: number;
}

export interface DirectoryCreator {
  id: string;
  subdomain: string;
  displayName: string | null;
  name: string;
  image: string | null;
  bio: string | null;
  tagline: string | null;
  niches: string[] | null;
  locationCity: string | null;
  locationCountry: string | null;
  rateRange: string | null;
  availableForHire: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  isBoosted: boolean;
  portfolioViewCount: number;
  directoryJoinedAt: Date | null;
  instagramHandles: string[] | null;
  tiktokHandles: string[] | null;
  youtubeHandles: string[] | null;
}

export async function getDirectoryCreators(
  filters: DirectoryFilters = {},
  sort: DirectorySort = {},
  pagination: DirectoryPagination = {}
): Promise<{ creators: DirectoryCreator[]; total: number }> {
  const { niches, location, rateRange, availableForHire, showAll } = filters;
  const { sort: sortOption = "popular" } = sort;
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = pagination;

  // Build conditions
  // Only show creators whose portfolio site is live (siteEnabled = true)
  // When showAll is true (authenticated users), show all creators with live sites
  // Otherwise, only show creators who opted into directory listing AND have live sites
  const conditions = showAll
    ? [
        sql`${users.subdomain} IS NOT NULL`,
        eq(users.siteEnabled, true),
        eq(users.status, "active"),
      ]
    : [
        eq(users.directoryListed, true),
        eq(users.siteEnabled, true),
        eq(users.status, "active"),
      ];

  // Exclude admin users from the directory
  const adminEmails = getAdminEmails();
  if (adminEmails.length > 0) {
    conditions.push(notInArray(users.email, adminEmails));
  }

  // Filter by niches (any match)
  if (niches && niches.length > 0) {
    conditions.push(arrayOverlaps(users.niches, niches));
  }

  // Filter by location (case-insensitive search in city or country)
  if (location) {
    conditions.push(
      sql`(${ilike(users.locationCity, `%${location}%`)} OR ${ilike(users.locationCountry, `%${location}%`)})`
    );
  }

  // Filter by rate range
  if (rateRange) {
    conditions.push(eq(users.rateRange, rateRange));
  }

  // Filter by availability
  if (availableForHire !== undefined) {
    conditions.push(eq(users.availableForHire, availableForHire));
  }

  // Determine sort order
  // For popular sort: prioritize permanently featured users, then users with active time-limited boosts, then by views
  const isBoosted = sql<boolean>`(${users.isFeatured} = true OR (${users.directoryBoostUntil} IS NOT NULL AND ${users.directoryBoostUntil} > NOW()))`;

  let orderBy;
  switch (sortOption) {
    case "recent":
      orderBy = [desc(users.directoryJoinedAt), desc(users.createdAt)];
      break;
    case "alphabetical":
      orderBy = [asc(users.displayName), asc(users.name)];
      break;
    case "popular":
    default:
      // Boosted users first (featured OR active time-limited boost), then by portfolio view count
      orderBy = [desc(isBoosted), desc(users.portfolioViewCount)];
      break;
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  // Get paginated creators
  const creators = await db
    .select({
      id: users.id,
      subdomain: users.subdomain,
      displayName: users.displayName,
      name: users.name,
      image: users.image,
      bio: users.bio,
      tagline: users.tagline,
      niches: users.niches,
      locationCity: users.locationCity,
      locationCountry: users.locationCountry,
      rateRange: users.rateRange,
      availableForHire: users.availableForHire,
      isFeatured: users.isFeatured,
      isVerified: users.isVerified,
      hideBadges: users.hideBadges,
      directoryBoostUntil: users.directoryBoostUntil,
      portfolioViewCount: users.portfolioViewCount,
      directoryJoinedAt: users.directoryJoinedAt,
      instagramHandles: users.instagramHandles,
      tiktokHandles: users.tiktokHandles,
      youtubeHandles: users.youtubeHandles,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const now = new Date();

  // Filter out creators without subdomain and compute isBoosted
  // Respect hideBadges preference — suppress isVerified in public view
  const validCreators = creators
    .filter((c) => c.subdomain !== null)
    .map((c) => ({
      id: c.id,
      subdomain: c.subdomain as string,
      displayName: c.displayName,
      name: c.name,
      image: c.image,
      bio: c.bio,
      tagline: c.tagline,
      niches: c.niches,
      locationCity: c.locationCity,
      locationCountry: c.locationCountry,
      rateRange: c.rateRange,
      availableForHire: c.availableForHire,
      isFeatured: c.isFeatured,
      isVerified: c.hideBadges ? false : c.isVerified,
      isBoosted: c.isFeatured || (c.directoryBoostUntil !== null && c.directoryBoostUntil > now),
      portfolioViewCount: c.portfolioViewCount,
      directoryJoinedAt: c.directoryJoinedAt,
      instagramHandles: c.instagramHandles,
      tiktokHandles: c.tiktokHandles,
      youtubeHandles: c.youtubeHandles,
    }));

  return { creators: validCreators, total };
}

export async function getCreatorBySubdomain(
  subdomain: string,
  options: { showAll?: boolean } = {}
): Promise<DirectoryCreator | null> {
  const { showAll } = options;

  // When showAll is true (authenticated users), show any creator with a live site
  // Otherwise, only show creators who opted into directory listing AND have live sites
  const conditions = showAll
    ? [
        eq(users.subdomain, subdomain.toLowerCase()),
        eq(users.siteEnabled, true),
        eq(users.status, "active"),
      ]
    : [
        eq(users.subdomain, subdomain.toLowerCase()),
        eq(users.directoryListed, true),
        eq(users.siteEnabled, true),
        eq(users.status, "active"),
      ];

  // Exclude admin users from the directory
  const adminEmails = getAdminEmails();
  if (adminEmails.length > 0) {
    conditions.push(notInArray(users.email, adminEmails));
  }

  const [creator] = await db
    .select({
      id: users.id,
      subdomain: users.subdomain,
      displayName: users.displayName,
      name: users.name,
      image: users.image,
      bio: users.bio,
      tagline: users.tagline,
      niches: users.niches,
      locationCity: users.locationCity,
      locationCountry: users.locationCountry,
      rateRange: users.rateRange,
      availableForHire: users.availableForHire,
      isFeatured: users.isFeatured,
      isVerified: users.isVerified,
      hideBadges: users.hideBadges,
      directoryBoostUntil: users.directoryBoostUntil,
      portfolioViewCount: users.portfolioViewCount,
      directoryJoinedAt: users.directoryJoinedAt,
      instagramHandles: users.instagramHandles,
      tiktokHandles: users.tiktokHandles,
      youtubeHandles: users.youtubeHandles,
    })
    .from(users)
    .where(and(...conditions))
    .limit(1);

  if (!creator || !creator.subdomain) return null;

  const now = new Date();

  return {
    id: creator.id,
    subdomain: creator.subdomain,
    displayName: creator.displayName,
    name: creator.name,
    image: creator.image,
    bio: creator.bio,
    tagline: creator.tagline,
    niches: creator.niches,
    locationCity: creator.locationCity,
    locationCountry: creator.locationCountry,
    rateRange: creator.rateRange,
    availableForHire: creator.availableForHire,
    isFeatured: creator.isFeatured,
    isVerified: creator.hideBadges ? false : creator.isVerified,
    isBoosted: creator.isFeatured || (creator.directoryBoostUntil !== null && creator.directoryBoostUntil > now),
    portfolioViewCount: creator.portfolioViewCount,
    directoryJoinedAt: creator.directoryJoinedAt,
    instagramHandles: creator.instagramHandles,
    tiktokHandles: creator.tiktokHandles,
    youtubeHandles: creator.youtubeHandles,
  };
}

export async function getDirectoryListedSubdomains(): Promise<string[]> {
  const adminEmails = getAdminEmails();
  const conditions = [
    eq(users.directoryListed, true),
    eq(users.siteEnabled, true),
    eq(users.status, "active"),
  ];

  // Exclude admin users from the directory
  if (adminEmails.length > 0) {
    conditions.push(notInArray(users.email, adminEmails));
  }

  const result = await db
    .select({ subdomain: users.subdomain })
    .from(users)
    .where(and(...conditions));

  return result
    .filter((r) => r.subdomain !== null)
    .map((r) => r.subdomain as string);
}
