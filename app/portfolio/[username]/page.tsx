import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, portfolios } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PortfolioRenderer } from "@/components/portfolio/renderer";
import { ViewTracker } from "@/components/portfolio/view-tracker";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase()),
  });

  if (!user) {
    return {
      title: "Portfolio Not Found - ugc.community",
    };
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: and(eq(portfolios.userId, user.id), eq(portfolios.isPublished, true)),
    orderBy: (portfolios, { desc }) => [desc(portfolios.updatedAt)],
  });

  if (!portfolio) {
    return {
      title: `${user.displayName || user.name} - ugc.community`,
      description: user.bio || `Check out ${user.name}'s UGC portfolio`,
    };
  }

  return {
    title: `${portfolio.title} - ${user.displayName || user.name}`,
    description:
      portfolio.tagline || user.bio || `Check out ${user.name}'s UGC portfolio`,
    openGraph: {
      title: `${portfolio.title} - ${user.displayName || user.name}`,
      description: portfolio.tagline || `UGC Creator Portfolio`,
      type: "profile",
      url: `https://${username}.ugc.community`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${portfolio.title} - ${user.displayName || user.name}`,
      description: portfolio.tagline || `UGC Creator Portfolio`,
    },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;

  // Find user by username
  const user = await db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase()),
  });

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
    <>
      <ViewTracker portfolioId={portfolio.id} />
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
    </>
  );
}

// Force dynamic rendering - portfolios need fresh data from database
export const dynamic = "force-dynamic";
