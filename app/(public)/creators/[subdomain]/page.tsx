import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, MapPin, Instagram, User, ArrowLeft, Trophy, Lock } from "lucide-react";
import { getCreatorBySubdomain } from "@/lib/directory/queries";
import { getUserBadgeMilestones } from "@/lib/milestones/queries";
import { getServerSession } from "@/lib/auth/session";
import { getPortfolioDataBySubdomain } from "@/lib/templates/queries";
import { PortfolioRenderer } from "@/lib/templates/render";

// TikTok icon (not in Lucide)
function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}
import { NicheBadges } from "@/components/directory/niche-badges";
import { VerifiedBadge } from "@/components/directory/verified-badge";
import { SaveCreatorSection } from "@/components/directory/save-creator-section";
import { RATE_RANGE_LABELS, type RateRange } from "@/lib/directory/constants";
import { Navbar } from "@/components/landing/navbar";
import { BackgroundBlobs } from "@/components/landing/background-blobs";

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;

  // Check if user is logged in to determine visibility
  const session = await getServerSession();
  const isLoggedIn = !!session;

  const creator = await getCreatorBySubdomain(subdomain, { showAll: isLoggedIn });

  if (!creator) {
    return {
      title: "Creator Not Found - ugc.community",
    };
  }

  const displayName = creator.displayName || creator.name;
  const description =
    creator.tagline ||
    creator.bio ||
    `${displayName} is a UGC creator on ugc.community`;

  return {
    title: `${displayName} - UGC Creator | ugc.community`,
    description,
    openGraph: {
      title: `${displayName} - UGC Creator`,
      description,
      type: "profile",
      images: creator.image ? [{ url: creator.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} - UGC Creator`,
      description,
      images: creator.image ? [creator.image] : undefined,
    },
  };
}

// JSON-LD structured data for SEO
function PersonJsonLd({
  name,
  image,
  description,
  subdomain,
  socials,
}: {
  name: string;
  image: string | null;
  description: string | null;
  subdomain: string;
  socials: { instagram?: string[]; tiktok?: string[]; youtube?: string[] };
}) {
  const sameAs: string[] = [];
  if (socials.instagram) {
    socials.instagram.forEach(handle => sameAs.push(`https://instagram.com/${handle}`));
  }
  if (socials.tiktok) {
    socials.tiktok.forEach(handle => sameAs.push(`https://tiktok.com/@${handle}`));
  }
  if (socials.youtube) {
    socials.youtube.forEach(handle => sameAs.push(`https://youtube.com/@${handle}`));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    image,
    description,
    url: `https://ugc.community/creators/${subdomain}`,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { subdomain } = await params;

  // Check if user is logged in
  const session = await getServerSession();
  const isLoggedIn = !!session;
  const currentUserId = session?.user?.id;

  // Authenticated users can see all creators with subdomains
  const creator = await getCreatorBySubdomain(subdomain, { showAll: isLoggedIn });

  if (!creator) {
    notFound();
  }

  // Check if viewing own portfolio (for draft preview)
  const isOwner = currentUserId === creator.id;

  // Try to fetch portfolio data
  // Include unpublished if owner is viewing
  const portfolioData = await getPortfolioDataBySubdomain(subdomain, {
    includeUnpublished: isOwner,
  });

  // If portfolio exists, render the template-based portfolio
  if (portfolioData) {
    return (
      <PortfolioRenderer
        user={portfolioData.user}
        config={portfolioData.config}
        template={portfolioData.template}
        projects={portfolioData.projects}
        projectCoverMedia={portfolioData.projectCoverMedia}
        mediaMap={portfolioData.mediaMap}
        isOwnerPreview={isOwner}
      />
    );
  }

  // No portfolio config - fall back to directory profile view

  // Fetch earned badge milestones for this creator
  const badgeMilestones = await getUserBadgeMilestones(creator.id);

  const displayName = creator.displayName || creator.name;
  const location = [creator.locationCity, creator.locationCountry]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PersonJsonLd
        name={displayName}
        image={creator.image}
        description={creator.tagline || creator.bio}
        subdomain={creator.subdomain}
        socials={{
          instagram: creator.instagramHandles || undefined,
          tiktok: creator.tiktokHandles || undefined,
          youtube: creator.youtubeHandles || undefined,
        }}
      />

      <div className="min-h-screen bg-cream relative">
        <BackgroundBlobs />
        <Navbar />

        {/* Header Section */}
        <header className="pt-32 pb-8 relative z-10">
          <div className="container">
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-8"
            >
              <ArrowLeft size={18} />
              Back to Directory
            </Link>

            {!isLoggedIn ? (
              /* Login Gate - Minimal Preview for Non-Authenticated Users */
              <div className="flex flex-col items-center text-center py-12">
                {/* Blurred Avatar */}
                <div className="relative mb-6">
                  {creator.image ? (
                    <img
                      src={creator.image}
                      alt=""
                      className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg blur-md"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-warm-gray-100 flex items-center justify-center shadow-lg">
                      <User size={48} className="text-warm-gray-400" />
                    </div>
                  )}
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-warm-gray-100 p-8 max-w-md mx-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-coral/10 to-rose/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={28} className="text-coral" />
                  </div>
                  <h1 className="text-xl font-semibold text-warm-gray-900 mb-2">
                    Sign in to view this creator
                  </h1>
                  <p className="text-warm-gray-600 mb-6">
                    Create a free account to explore creator profiles, view portfolios, and connect with UGC talent.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/sign-in"
                      className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="inline-flex items-center justify-center px-6 py-3 bg-warm-gray-100 text-warm-gray-700 font-medium rounded-full hover:bg-warm-gray-200 transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Profile Header for Authenticated Users */
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {creator.image ? (
                    <img
                      src={creator.image}
                      alt={displayName}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-warm-gray-100 flex items-center justify-center shadow-lg">
                      <User size={48} className="text-warm-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  {/* Name and badges */}
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900">
                      {displayName}
                    </h1>
                    <VerifiedBadge
                      isVerified={creator.isVerified}
                      isFeatured={creator.isFeatured}
                      isBoosted={creator.isBoosted}
                    />
                    <SaveCreatorSection creatorId={creator.id} />
                  </div>

                  {/* Milestone Badges */}
                  {badgeMilestones.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {badgeMilestones.map(({ milestone }) => (
                        <div
                          key={milestone.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200"
                          title={milestone.description || milestone.name}
                        >
                          <Trophy size={12} className="text-amber-500" />
                          {milestone.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tagline */}
                  {creator.tagline && (
                    <p className="text-lg text-warm-gray-600 mb-4">
                      {creator.tagline}
                    </p>
                  )}

                  {/* Meta info row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-warm-gray-500 mb-4">
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {location}
                      </span>
                    )}
                    {creator.rateRange && (
                      <span className="text-warm-gray-700 font-medium">
                        {RATE_RANGE_LABELS[creator.rateRange as RateRange]}
                      </span>
                    )}
                    {creator.availableForHire && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-mint/20 text-mint">
                        Available for hire
                      </span>
                    )}
                  </div>

                  {/* Niches */}
                  <div className="mb-4">
                    <NicheBadges niches={creator.niches} max={10} />
                  </div>

                  {/* Social Links */}
                  {((creator.instagramHandles && creator.instagramHandles.length > 0) ||
                    (creator.tiktokHandles && creator.tiktokHandles.length > 0) ||
                    (creator.youtubeHandles && creator.youtubeHandles.length > 0)) && (
                    <div className="flex flex-wrap gap-3">
                      {creator.instagramHandles?.map((handle, idx) => (
                        <a
                          key={`ig-${idx}`}
                          href={`https://instagram.com/${handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full text-sm text-warm-gray-700 transition-colors shadow-sm"
                        >
                          <Instagram size={14} />@{handle}
                        </a>
                      ))}
                      {creator.tiktokHandles?.map((handle, idx) => (
                        <a
                          key={`tt-${idx}`}
                          href={`https://tiktok.com/@${handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full text-sm text-warm-gray-700 transition-colors shadow-sm"
                        >
                          <TikTokIcon size={14} />@{handle}
                        </a>
                      ))}
                      {creator.youtubeHandles?.map((handle, idx) => (
                        <a
                          key={`yt-${idx}`}
                          href={`https://youtube.com/@${handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full text-sm text-warm-gray-700 transition-colors shadow-sm"
                        >
                          @{handle}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content - Only show for authenticated users */}
        {isLoggedIn && (
          <main className="container pb-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - About */}
              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-warm-gray-100">
                  <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
                    About
                  </h2>
                  {creator.bio ? (
                    <p className="text-warm-gray-600 whitespace-pre-line">
                      {creator.bio}
                    </p>
                  ) : (
                    <p className="text-warm-gray-400 italic">
                      No bio available yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - No Portfolio Message */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-warm-gray-100 p-8 text-center">
                  <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={32} className="text-warm-gray-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-warm-gray-900 mb-2">
                    Portfolio Coming Soon
                  </h2>
                  <p className="text-warm-gray-600">
                    This creator hasn&apos;t set up their portfolio yet.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </>
  );
}
