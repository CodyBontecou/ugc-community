import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, portfolios } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PortfolioRenderer } from "@/components/portfolio/renderer";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ subdomain: string }>;
};

async function getUserBySubdomain(subdomain: string) {
  return db.query.users.findFirst({
    where: eq(users.subdomain, subdomain.toLowerCase()),
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;

  const user = await getUserBySubdomain(subdomain);

  if (!user) {
    return {
      title: "Portfolio Not Found",
      description: "This portfolio does not exist.",
    };
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: and(eq(portfolios.userId, user.id), eq(portfolios.isPublished, true)),
    orderBy: (portfolios, { desc }) => [desc(portfolios.updatedAt)],
  });

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "ugc.community";
  const portfolioUrl = `https://${subdomain}.${baseDomain}`;

  if (!portfolio) {
    return {
      title: `${user.displayName || user.name}`,
      description: user.bio || `Check out ${user.name}'s portfolio`,
    };
  }

  return {
    title: `${portfolio.title} - ${user.displayName || user.name}`,
    description:
      portfolio.tagline || user.bio || `Check out ${user.name}'s portfolio`,
    openGraph: {
      title: `${portfolio.title} - ${user.displayName || user.name}`,
      description: portfolio.tagline || `Creator Portfolio`,
      type: "profile",
      url: portfolioUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${portfolio.title} - ${user.displayName || user.name}`,
      description: portfolio.tagline || `Creator Portfolio`,
    },
  };
}

export default async function SubdomainPortfolioPage({ params }: Props) {
  const { subdomain } = await params;

  // Find user by subdomain
  const user = await getUserBySubdomain(subdomain);

  if (!user) {
    notFound();
  }

  // Find published portfolio
  const portfolio = await db.query.portfolios.findFirst({
    where: and(eq(portfolios.userId, user.id), eq(portfolios.isPublished, true)),
    with: {
      sections: {
        where: (sections, { eq }) => eq(sections.isVisible, true),
        orderBy: (sections, { asc }) => [asc(sections.order)],
      },
      media: true,
    },
    orderBy: (portfolios, { desc }) => [desc(portfolios.updatedAt)],
  });

  if (!portfolio) {
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

// Force dynamic rendering - portfolios need fresh data from database
export const dynamic = "force-dynamic";
