import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, desc, asc, sql, ilike, arrayOverlaps } from "drizzle-orm";
import {
  type Niche,
  type RateRange,
  type SortOption,
  DEFAULT_PAGE_SIZE,
} from "./constants";

export interface DirectoryFilters {
  niches?: Niche[];
  location?: string;
  rateRange?: RateRange;
  availableForHire?: boolean;
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
  portfolioViewCount: number;
  directoryJoinedAt: Date | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
}

export async function getDirectoryCreators(
  filters: DirectoryFilters = {},
  sort: DirectorySort = {},
  pagination: DirectoryPagination = {}
): Promise<{ creators: DirectoryCreator[]; total: number }> {
  const { niches, location, rateRange, availableForHire } = filters;
  const { sort: sortOption = "popular" } = sort;
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = pagination;

  // Build conditions
  const conditions = [
    eq(users.directoryListed, true),
    eq(users.status, "active"),
  ];

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
      // Featured first, then by portfolio view count
      orderBy = [desc(users.isFeatured), desc(users.portfolioViewCount)];
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
      portfolioViewCount: users.portfolioViewCount,
      directoryJoinedAt: users.directoryJoinedAt,
      instagramHandle: users.instagramHandle,
      tiktokHandle: users.tiktokHandle,
      youtubeHandle: users.youtubeHandle,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Filter out creators without subdomain and cast types
  const validCreators = creators
    .filter((c) => c.subdomain !== null)
    .map((c) => ({
      ...c,
      subdomain: c.subdomain as string,
    }));

  return { creators: validCreators, total };
}

export async function getCreatorBySubdomain(
  subdomain: string
): Promise<DirectoryCreator | null> {
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
      portfolioViewCount: users.portfolioViewCount,
      directoryJoinedAt: users.directoryJoinedAt,
      instagramHandle: users.instagramHandle,
      tiktokHandle: users.tiktokHandle,
      youtubeHandle: users.youtubeHandle,
    })
    .from(users)
    .where(
      and(
        eq(users.subdomain, subdomain.toLowerCase()),
        eq(users.directoryListed, true),
        eq(users.status, "active")
      )
    )
    .limit(1);

  if (!creator || !creator.subdomain) return null;

  return {
    ...creator,
    subdomain: creator.subdomain,
  };
}

export async function getDirectoryListedSubdomains(): Promise<string[]> {
  const result = await db
    .select({ subdomain: users.subdomain })
    .from(users)
    .where(
      and(eq(users.directoryListed, true), eq(users.status, "active"))
    );

  return result
    .filter((r) => r.subdomain !== null)
    .map((r) => r.subdomain as string);
}
