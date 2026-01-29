import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, MapPin, Instagram, User, ArrowLeft } from "lucide-react";
import { getCreatorBySubdomain } from "@/lib/directory/queries";
import { NicheBadges } from "@/components/directory/niche-badges";
import { VerifiedBadge } from "@/components/directory/verified-badge";
import { RATE_RANGE_LABELS, type RateRange } from "@/lib/directory/constants";
import { Navbar } from "@/components/landing/navbar";
import { BackgroundBlobs } from "@/components/landing/background-blobs";

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const creator = await getCreatorBySubdomain(subdomain);

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
  socials: { instagram?: string; tiktok?: string; youtube?: string };
}) {
  const sameAs: string[] = [];
  if (socials.instagram) sameAs.push(`https://instagram.com/${socials.instagram}`);
  if (socials.tiktok) sameAs.push(`https://tiktok.com/@${socials.tiktok}`);
  if (socials.youtube) sameAs.push(`https://youtube.com/@${socials.youtube}`);

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
  const creator = await getCreatorBySubdomain(subdomain);

  if (!creator) {
    notFound();
  }

  const displayName = creator.displayName || creator.name;
  const location = [creator.locationCity, creator.locationCountry]
    .filter(Boolean)
    .join(", ");
  const portfolioUrl = `https://${creator.subdomain}.ugc.community`;

  return (
    <>
      <PersonJsonLd
        name={displayName}
        image={creator.image}
        description={creator.tagline || creator.bio}
        subdomain={creator.subdomain}
        socials={{
          instagram: creator.instagramHandle || undefined,
          tiktok: creator.tiktokHandle || undefined,
          youtube: creator.youtubeHandle || undefined,
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

            {/* Profile Header */}
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
                  />
                </div>

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
                {(creator.instagramHandle ||
                  creator.tiktokHandle ||
                  creator.youtubeHandle) && (
                  <div className="flex flex-wrap gap-3">
                    {creator.instagramHandle && (
                      <a
                        href={`https://instagram.com/${creator.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full text-sm text-warm-gray-700 transition-colors shadow-sm"
                      >
                        <Instagram size={14} />@{creator.instagramHandle}
                      </a>
                    )}
                    {creator.tiktokHandle && (
                      <a
                        href={`https://tiktok.com/@${creator.tiktokHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full text-sm text-warm-gray-700 transition-colors shadow-sm"
                      >
                        @{creator.tiktokHandle}
                      </a>
                    )}
                    {creator.youtubeHandle && (
                      <a
                        href={`https://youtube.com/@${creator.youtubeHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white rounded-full text-sm text-warm-gray-700 transition-colors shadow-sm"
                      >
                        @{creator.youtubeHandle}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
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

            {/* Right Column - Portfolio Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-warm-gray-100">
                <div className="p-4 border-b border-warm-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-warm-gray-900">
                    Portfolio Preview
                  </h2>
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coral to-rose text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                  >
                    View Full Site
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Browser Chrome */}
                <div className="bg-warm-gray-50 border-b border-warm-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-warm-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-warm-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-warm-gray-200" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-md px-4 py-1.5 text-sm text-warm-gray-500 border border-warm-gray-100 max-w-md w-full text-center truncate">
                      {creator.subdomain}.ugc.community
                    </div>
                  </div>
                </div>

                {/* Portfolio iframe */}
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group"
                >
                  <div className="relative aspect-[16/10] bg-warm-gray-50 overflow-hidden">
                    <iframe
                      src={portfolioUrl}
                      className="w-full h-full border-0 pointer-events-none"
                      title={`${displayName}'s portfolio`}
                      loading="lazy"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-warm-gray-900/0 group-hover:bg-warm-gray-900/60 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-white text-warm-gray-900 px-6 py-3 rounded-full font-semibold shadow-lg">
                        <span>Visit Site</span>
                        <ExternalLink size={18} />
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
