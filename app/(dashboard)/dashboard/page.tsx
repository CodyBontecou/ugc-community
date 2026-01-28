import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { portfolios, portfolioViews } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import {
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - ugc.community",
  description: "Manage your UGC portfolio",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) return null;

  const portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.userId, session.user.id),
    with: {
      sections: true,
    },
  });

  // Get portfolio view count
  let viewCount = 0;
  if (portfolio) {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(portfolioViews)
      .where(eq(portfolioViews.portfolioId, portfolio.id));
    viewCount = result[0]?.count ?? 0;
  }

  const firstName = session.user.name?.split(" ")[0] || "Creator";

  // No portfolio state
  if (!portfolio) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Hero section for new users */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
            Hey {firstName}!
          </h1>
          <p className="text-lg text-warm-gray-500">
            Let&apos;s create your portfolio with AI
          </p>
        </div>

        {/* Main CTA card */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-coral via-rose to-lavender rounded-[32px] blur-xl opacity-30" />
          <div className="relative bg-white rounded-[--radius-2xl] border border-warm-gray-200 p-8 md:p-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-peach-100 to-peach-200 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={36} className="text-rose" />
              </div>
              <h2 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-3">
                Create your portfolio
              </h2>
              <p className="text-warm-gray-500 mb-8 max-w-md mx-auto">
                Describe your brand, niche, and style. Our AI will generate a beautiful portfolio you can customize with simple chat commands.
              </p>
              <Link
                href="/dashboard/ai-generate"
                className="inline-flex items-center gap-3 px-8 py-4 bg-warm-gray-900 text-white font-medium rounded-full hover:bg-warm-gray-800 transition-colors text-lg"
              >
                <Sparkles size={20} />
                Start with AI
              </Link>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="w-10 h-10 rounded-full bg-peach-100 flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={18} className="text-coral-dark" />
            </div>
            <p className="text-sm text-warm-gray-600 font-medium">Describe</p>
            <p className="text-xs text-warm-gray-400 mt-1">Tell AI about your brand</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-peach-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={18} className="text-coral-dark" />
            </div>
            <p className="text-sm text-warm-gray-600 font-medium">Generate</p>
            <p className="text-xs text-warm-gray-400 mt-1">AI builds your portfolio</p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-peach-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={18} className="text-coral-dark" />
            </div>
            <p className="text-sm text-warm-gray-600 font-medium">Publish</p>
            <p className="text-xs text-warm-gray-400 mt-1">Go live instantly</p>
          </div>
        </div>
      </div>
    );
  }

  // Has portfolio state
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Your Portfolio
          </h1>
          <p className="mt-1 text-warm-gray-500">
            Edit anytime with AI chat commands
          </p>
        </div>
        {portfolio.isPublished && session.user.username && (
          <a
            href={`/?subdomain=${session.user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-warm-gray-600 bg-white border border-warm-gray-200 rounded-full hover:border-warm-gray-300 transition-colors"
          >
            <ExternalLink size={14} />
            View Live
          </a>
        )}
      </div>

      {/* Portfolio Card - Main focal point */}
      <div className="relative mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-coral/20 via-rose/20 to-lavender/20 rounded-[32px] blur-lg" />
        <div className="relative bg-white rounded-[--radius-2xl] border border-warm-gray-200 overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-warm-gray-100 bg-warm-gray-50/50">
            <div className="flex items-center gap-3">
              {portfolio.isPublished ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-700">Live</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-sm font-medium text-amber-700">Draft</span>
                </>
              )}
            </div>
            <span className="text-xs text-warm-gray-400">
              Updated {new Date(portfolio.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Portfolio info */}
          <div className="p-6">
            <h2 className="text-xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-1">
              {portfolio.title}
            </h2>
            <p className="text-warm-gray-500 text-sm mb-6">
              {portfolio.tagline || "No tagline set"}
            </p>

            {/* Action button */}
            <Link
              href="/dashboard/portfolio/edit"
              className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-warm-gray-900 text-white font-medium rounded-[--radius-lg] hover:bg-warm-gray-800 transition-colors"
            >
              <Sparkles size={18} />
              Edit with AI
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[--radius-md] bg-lavender/10 flex items-center justify-center">
              <Eye size={18} className="text-lavender" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-gray-900 tabular-nums">
                {viewCount.toLocaleString()}
              </p>
              <p className="text-xs text-warm-gray-400">Profile views</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[--radius-md] bg-mint/20 flex items-center justify-center">
              {portfolio.isPublished ? (
                <Eye size={18} className="text-green-600" />
              ) : (
                <EyeOff size={18} className="text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-gray-900">
                {portfolio.isPublished ? "Live" : "Draft"}
              </p>
              <p className="text-xs text-warm-gray-400">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tip section */}
      <div className="mt-8 p-5 bg-peach-100/50 rounded-[--radius-xl] border border-peach-200">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-rose" />
          </div>
          <div>
            <p className="text-sm font-medium text-warm-gray-800 mb-1">
              Tip: Edit with natural language
            </p>
            <p className="text-xs text-warm-gray-600">
              Just tell AI what you want to change. Try &quot;Make my hero section more bold&quot; or &quot;Add a testimonials section&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-warm-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 bg-warm-gray-200 rounded-[--radius-xl]"
              />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
