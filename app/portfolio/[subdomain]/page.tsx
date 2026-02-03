import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { onboardingQuestionnaires, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildCreatorData } from "@/lib/portfolio/creator-data";
import {
  Hero,
  Stats,
  BrandPartners,
  VideoShowcase,
  ImageGallery,
  Services,
  Contact,
} from "@/components/portfolio";
import { ViewTracker } from "@/components/portfolio/ViewTracker";

export const dynamic = "force-dynamic";

interface PortfolioPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { subdomain } = await params;
  const normalizedSubdomain = subdomain.toLowerCase();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
    })
    .from(users)
    .where(eq(users.subdomain, normalizedSubdomain))
    .limit(1);

  if (!user || user.status !== "active") {
    notFound();
  }

  const [questionnaire] = await db
    .select({
      name: onboardingQuestionnaires.name,
      email: onboardingQuestionnaires.email,
      niche: onboardingQuestionnaires.niche,
      tagline: onboardingQuestionnaires.tagline,
      bio: onboardingQuestionnaires.bio,
      location: onboardingQuestionnaires.location,
      socialMediaHandles: onboardingQuestionnaires.socialMediaHandles,
      brandPartnerships: onboardingQuestionnaires.brandPartnerships,
      videos: onboardingQuestionnaires.videos,
      images: onboardingQuestionnaires.images,
      selectedServices: onboardingQuestionnaires.selectedServices,
    })
    .from(onboardingQuestionnaires)
    .where(eq(onboardingQuestionnaires.userId, user.id))
    .limit(1);

  if (!questionnaire) {
    notFound();
  }

  const creator = buildCreatorData(questionnaire, {
    name: user.name,
    email: user.email,
  });

  return (
    <main className="min-h-screen bg-background">
      <ViewTracker portfolioId={user.id} />
      <Hero creator={creator} />
      <Stats creator={creator} />
      <BrandPartners creator={creator} />
      <VideoShowcase creator={creator} />
      <ImageGallery creator={creator} />
      <Services creator={creator} />
      <Contact creator={creator} />
    </main>
  );
}
