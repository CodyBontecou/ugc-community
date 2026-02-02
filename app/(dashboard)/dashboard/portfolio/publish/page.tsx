import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { getUserPortfolioConfig } from "@/lib/templates/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ArrowLeft, Globe, Eye, ExternalLink, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { PublishManager } from "./publish-manager";

export const metadata: Metadata = {
  title: "Publish Portfolio - ugc.community",
  description: "Publish or unpublish your portfolio",
};

export const dynamic = "force-dynamic";

async function PublishContent() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [portfolioConfig, user] = await Promise.all([
    getUserPortfolioConfig(session.user.id),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { subdomain: true },
    }),
  ]);

  if (!portfolioConfig || !portfolioConfig.templateId) {
    redirect("/dashboard/portfolio/templates");
  }

  const subdomain = user?.subdomain;
  const isPublished = portfolioConfig.isPublished;
  const publishedAt = portfolioConfig.publishedAt;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/portfolio"
          className="w-10 h-10 rounded-full bg-warm-gray-100 hover:bg-warm-gray-200 flex items-center justify-center text-warm-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Publish Portfolio
          </h1>
          <p className="mt-1 text-warm-gray-500">
            Control who can see your portfolio
          </p>
        </div>
      </div>

      {/* No subdomain warning */}
      {!subdomain && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                No subdomain configured
              </p>
              <p className="text-sm text-amber-700 mt-1">
                You need a subdomain to publish your portfolio. Go to Settings to
                set one up.
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-block mt-2 text-sm text-amber-800 underline hover:no-underline"
              >
                Go to Settings →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Status Card */}
      <div
        className={`p-6 rounded-xl border ${
          isPublished
            ? "bg-mint/10 border-mint/30"
            : "bg-warm-gray-50 border-warm-gray-200"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          {isPublished ? (
            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-mint" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-warm-gray-200 flex items-center justify-center">
              <Eye className="w-5 h-5 text-warm-gray-500" />
            </div>
          )}
          <div>
            <h2
              className={`font-semibold ${
                isPublished ? "text-mint" : "text-warm-gray-700"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </h2>
            <p className="text-sm text-warm-gray-500">
              {isPublished
                ? `Live since ${publishedAt?.toLocaleDateString()}`
                : "Only you can see this portfolio"}
            </p>
          </div>
        </div>

        {/* Preview URL */}
        {subdomain && (
          <div className="p-3 bg-white rounded-lg border border-warm-gray-200 mb-4">
            <p className="text-xs text-warm-gray-500 mb-1">Your portfolio URL</p>
            <div className="flex items-center justify-between">
              <code className="text-sm text-warm-gray-900">
                ugc.community/creators/{subdomain}
              </code>
              <Link
                href={`/creators/${subdomain}`}
                target="_blank"
                className="text-coral hover:text-coral/80 transition-colors"
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        )}

        {/* Publish Manager */}
        <PublishManager
          isPublished={isPublished}
          hasSubdomain={!!subdomain}
        />
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-warm-gray-50 rounded-xl">
        <h3 className="font-medium text-warm-gray-900 mb-2">
          What happens when you publish?
        </h3>
        <ul className="space-y-2 text-sm text-warm-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-mint">✓</span>
            Your portfolio becomes visible to anyone with the link
          </li>
          <li className="flex items-start gap-2">
            <span className="text-mint">✓</span>
            Search engines can index your portfolio
          </li>
          <li className="flex items-start gap-2">
            <span className="text-mint">✓</span>
            You can share the link on social media
          </li>
          <li className="flex items-start gap-2">
            <span className="text-mint">✓</span>
            You can unpublish anytime to make it private again
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function PublishPage() {
  return (
    <div className="p-6 md:p-10">
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-10 w-48 bg-warm-gray-200 rounded mb-4" />
              <div className="h-6 w-64 bg-warm-gray-100 rounded mb-8" />
              <div className="h-48 bg-warm-gray-100 rounded-xl" />
            </div>
          </div>
        }
      >
        <PublishContent />
      </Suspense>
    </div>
  );
}
