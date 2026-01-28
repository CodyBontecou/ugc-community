import { getDb } from "@/lib/db";
import { users, portfolios } from "@/lib/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import {
  Navbar,
  BackgroundBlobs,
  Hero,
  SocialProof,
  Features,
  PortfolioExamples,
  HowItWorks,
  Testimonials,
  Pricing,
  FinalCTA,
  Footer,
} from "@/components/landing";
import type { CreatorAvatar } from "@/components/landing/social-proof";
import type { FeaturedCreator } from "@/components/landing/portfolio-examples";

async function getLandingPageData() {
  const db = getDb();

  // Get users with published portfolios and subdomains
  const creatorsWithPortfolios = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      subdomain: users.subdomain,
      bio: users.bio,
      instagramHandle: users.instagramHandle,
    })
    .from(users)
    .innerJoin(portfolios, eq(users.id, portfolios.userId))
    .where(
      and(
        isNotNull(users.subdomain),
        eq(portfolios.isPublished, true)
      )
    )
    .limit(20);

  const creatorCount = creatorsWithPortfolios.length;

  // For social proof avatars
  const socialProofCreators: CreatorAvatar[] = creatorsWithPortfolios
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      name: c.name,
      image: c.image,
    }));

  // For featured portfolio examples (first 3)
  const featuredCreators: FeaturedCreator[] = creatorsWithPortfolios
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      name: c.name,
      subdomain: c.subdomain!,
      bio: c.bio,
      image: c.image,
      instagramHandle: c.instagramHandle,
    }));

  return {
    creatorCount,
    socialProofCreators,
    featuredCreators,
  };
}

export default async function HomePage() {
  const { creatorCount, socialProofCreators, featuredCreators } =
    await getLandingPageData();

  return (
    <div className="relative overflow-hidden">
      <BackgroundBlobs />
      <Navbar />
      <Hero />
      <SocialProof creatorCount={creatorCount} creators={socialProofCreators} />
      <Features />
      <PortfolioExamples creators={featuredCreators} />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
