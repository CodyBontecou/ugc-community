import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import {
  Navbar,
  BackgroundBlobs,
  Hero,
  SocialProof,
  Features,
  HowItWorks,
  Examples,
  Testimonials,
  Pricing,
  FinalCTA,
  Footer,
} from "@/components/landing";
import type { CreatorAvatar } from "@/components/landing/social-proof";

async function getLandingPageData() {
  const db = getDb();

  // Get users with subdomains (active creators)
  const activeCreators = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
    })
    .from(users)
    .where(isNotNull(users.subdomain))
    .limit(20);

  const creatorCount = activeCreators.length;

  // For social proof avatars
  const socialProofCreators: CreatorAvatar[] = activeCreators
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      name: c.name,
      image: c.image,
    }));

  // Get Daniela's profile image for the testimonial
  const [daniela] = await db
    .select({ image: users.image })
    .from(users)
    .where(eq(users.subdomain, "daniela"))
    .limit(1);

  const testimonialImage = daniela?.image || null;

  return {
    creatorCount,
    socialProofCreators,
    testimonialImage,
  };
}

export default async function HomePage() {
  const { creatorCount, socialProofCreators, testimonialImage } = await getLandingPageData();

  return (
    <div className="relative overflow-hidden">
      <BackgroundBlobs />
      <Navbar />
      <Hero />
      <SocialProof creatorCount={creatorCount} creators={socialProofCreators} />
      <Features />
      <HowItWorks />
      <Examples />
      <Testimonials authorImage={testimonialImage} />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
