import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, MapPin, Instagram, User } from "lucide-react";
import { getCreatorBySubdomain } from "@/lib/directory/queries";
import { NicheBadges } from "@/components/directory/niche-badges";
import { VerifiedBadge } from "@/components/directory/verified-badge";
import { RATE_RANGE_LABELS, type RateRange } from "@/lib/directory/constants";

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

      <div className="min-h-screen bg-cream">
        {/* Header */}
        <header className="bg-white border-b border-warm-gray-200">
          <div className="container py-4">
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Directory
            </Link>
          </div>
        </header>

        {/* Profile Content */}
        <main className="container py-8">
          <div className="max-w-3xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
              {/* Cover / Header area */}
              <div className="h-32 bg-gradient-to-br from-lavender-soft to-coral/20" />

              {/* Profile Info */}
              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="-mt-16 mb-4">
                  {creator.image ? (
                    <img
                      src={creator.image}
                      alt={displayName}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-warm-gray-100 flex items-center justify-center shadow-lg">
                      <User size={48} className="text-warm-gray-400" />
                    </div>
                  )}
                </div>

                {/* Name and badges */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mint/10 text-mint">
                      Available for hire
                    </span>
                  )}
                </div>

                {/* Niches */}
                <div className="mb-6">
                  <NicheBadges niches={creator.niches} max={10} />
                </div>

                {/* Bio */}
                {creator.bio && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-warm-gray-700 mb-2">
                      About
                    </h2>
                    <p className="text-warm-gray-600 whitespace-pre-line">
                      {creator.bio}
                    </p>
                  </div>
                )}

                {/* Social Links */}
                {(creator.instagramHandle ||
                  creator.tiktokHandle ||
                  creator.youtubeHandle) && (
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold text-warm-gray-700 mb-2">
                      Social
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {creator.instagramHandle && (
                        <a
                          href={`https://instagram.com/${creator.instagramHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-full text-sm text-warm-gray-700 transition-colors"
                        >
                          <Instagram size={14} />@{creator.instagramHandle}
                        </a>
                      )}
                      {creator.tiktokHandle && (
                        <a
                          href={`https://tiktok.com/@${creator.tiktokHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-full text-sm text-warm-gray-700 transition-colors"
                        >
                          @{creator.tiktokHandle}
                        </a>
                      )}
                      {creator.youtubeHandle && (
                        <a
                          href={`https://youtube.com/@${creator.youtubeHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-full text-sm text-warm-gray-700 transition-colors"
                        >
                          @{creator.youtubeHandle}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-4 border-t border-warm-gray-100">
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity"
                  >
                    View Full Portfolio
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-warm-gray-200 py-8">
          <div className="container text-center">
            <Link
              href="/creators"
              className="text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
            >
              Browse more creators
            </Link>
            <span className="mx-3 text-warm-gray-300">|</span>
            <Link
              href="/"
              className="text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
            >
              ugc.community
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
