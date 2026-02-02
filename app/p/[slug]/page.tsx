import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, portfolios } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { PortfolioRenderer } from "@/components/portfolio/renderer";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

// Helper to check if a string is a valid UUID
function isUuid(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let portfolio;
  let user;

  if (isUuid(slug)) {
    // Lookup by portfolio ID
    portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.id, slug),
    });

    if (portfolio) {
      user = await db.query.users.findFirst({
        where: eq(users.id, portfolio.userId),
      });
    }
  } else {
    // Lookup by username
    user = await db.query.users.findFirst({
      where: eq(users.username, slug.toLowerCase()),
    });

    if (user) {
      portfolio = await db.query.portfolios.findFirst({
        where: eq(portfolios.userId, user.id),
        orderBy: (portfolios, { desc }) => [desc(portfolios.updatedAt)],
      });
    }
  }

  if (!portfolio || !user) {
    return {
      title: "Portfolio Preview - ugc.community",
    };
  }

  return {
    title: `${portfolio.title} (Preview) - ${user.displayName || user.name}`,
    description: portfolio.tagline || `Preview of ${user.name}'s portfolio`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PortfolioPreviewPage({ params }: Props) {
  const { slug } = await params;

  let portfolio;
  let user;

  if (isUuid(slug)) {
    // Lookup by portfolio ID
    portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.id, slug),
      with: {
        sections: {
          where: (sections, { eq }) => eq(sections.isVisible, true),
          orderBy: (sections, { asc }) => [asc(sections.order)],
        },
        media: true,
      },
    });

    if (portfolio) {
      user = await db.query.users.findFirst({
        where: eq(users.id, portfolio.userId),
      });
    }
  } else {
    // Lookup by username
    user = await db.query.users.findFirst({
      where: eq(users.username, slug.toLowerCase()),
    });

    if (user) {
      portfolio = await db.query.portfolios.findFirst({
        where: eq(portfolios.userId, user.id),
        with: {
          sections: {
            where: (sections, { eq }) => eq(sections.isVisible, true),
            orderBy: (sections, { asc }) => [asc(sections.order)],
          },
          media: true,
        },
        orderBy: (portfolios, { desc }) => [desc(portfolios.updatedAt)],
      });
    }
  }

  if (!portfolio || !user) {
    notFound();
  }

  return (
    <PortfolioRenderer
      portfolio={portfolio}
      user={{
        name: user.displayName || user.name,
        image: user.image,
        bio: user.bio,
        instagram: user.instagramHandle,
        tiktok: user.tiktokHandle,
        youtube: user.youtubeHandle,
        twitter: user.twitterHandle,
        website: user.websiteUrl,
      }}
    />
  );
}

// Force dynamic rendering - preview needs fresh data from database
export const dynamic = "force-dynamic";
