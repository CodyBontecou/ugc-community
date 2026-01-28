import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { portfolios, portfolioViews, users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import {
  Eye,
  Sparkles,
  ExternalLink,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { SubdomainInline } from "@/components/dashboard/subdomain-inline";
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

  // Fetch portfolio and user data in parallel
  const [portfolio, user] = await Promise.all([
    db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
      with: {
        sections: true,
      },
    }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { subdomain: true },
    }),
  ]);

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
  const subdomain = user?.subdomain || null;

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
                className="inline-flex items-center gap-3 px-8 py-4 bg-warm-gray-900 font-medium rounded-full hover:bg-warm-gray-800 transition-colors text-lg"
                style={{ color: '#FFFFFF' }}
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
    <div className="max-w-5xl mx-auto">
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
        <div className="flex items-center gap-3">
          {portfolio.isPublished && subdomain && (
            <a
              href={`https://${subdomain}.ugc.community`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-warm-gray-600 bg-white border border-warm-gray-200 rounded-full hover:border-warm-gray-300 transition-colors"
            >
              <ExternalLink size={14} />
              View Live
            </a>
          )}
          <Link
            href="/dashboard/portfolio/edit"
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-warm-gray-900 hover:bg-warm-gray-800 transition-colors"
            style={{ color: '#FFFFFF' }}
          >
            <Sparkles size={14} />
            Edit with AI
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Preview window - takes up more space */}
        <div className="lg:col-span-3">
          <div className="bg-warm-gray-800 rounded-[--radius-xl] overflow-hidden shadow-xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-warm-gray-900">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-warm-gray-700 rounded-md px-3 py-1.5 text-xs text-warm-gray-400 font-mono truncate">
                  {subdomain ? `${subdomain}.ugc.community` : "yourname.ugc.community"}
                </div>
              </div>
            </div>

            {/* Preview iframe */}
            <div className="relative bg-white" style={{ height: "480px" }}>
              {portfolio.htmlContent ? (
                <iframe
                  srcDoc={portfolio.htmlContent}
                  className="w-full h-full border-0 pointer-events-none"
                  sandbox="allow-same-origin"
                  title="Portfolio Preview"
                  style={{
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                    width: "200%",
                    height: "200%",
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-warm-gray-50">
                  <div className="text-center">
                    <Sparkles size={32} className="text-warm-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-warm-gray-400">No preview available</p>
                  </div>
                </div>
              )}

              {/* Hover overlay to edit */}
              <Link
                href="/dashboard/portfolio/edit"
                className="absolute inset-0 bg-warm-gray-900/0 hover:bg-warm-gray-900/60 transition-colors flex items-center justify-center group"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-6 py-3 bg-white rounded-full text-warm-gray-900 font-medium shadow-lg">
                  <Sparkles size={18} />
                  Edit with AI
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-warm-gray-900">Status</h3>
              {portfolio.isPublished ? (
                <span className="flex items-center gap-1.5 text-sm text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Draft
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-warm-gray-400 mb-0.5">Title</p>
                <p className="text-sm text-warm-gray-900 font-medium truncate">{portfolio.title}</p>
              </div>
              <div>
                <p className="text-xs text-warm-gray-400 mb-0.5">Tagline</p>
                <p className="text-sm text-warm-gray-600 truncate">{portfolio.tagline || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-warm-gray-400 mb-0.5">Last updated</p>
                <p className="text-sm text-warm-gray-600">{new Date(portfolio.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Views card */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[--radius-lg] bg-lavender/10 flex items-center justify-center">
                <Eye size={22} className="text-lavender" />
              </div>
              <div>
                <p className="text-3xl font-semibold text-warm-gray-900 tabular-nums">
                  {viewCount.toLocaleString()}
                </p>
                <p className="text-sm text-warm-gray-400">Profile views</p>
              </div>
            </div>
          </div>

          {/* Subdomain management */}
          <SubdomainInline initialSubdomain={subdomain} />

          {/* Tip card */}
          <div className="p-4 bg-peach-100/50 rounded-[--radius-xl] border border-peach-200">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-rose mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warm-gray-800 mb-1">
                  Edit with natural language
                </p>
                <p className="text-xs text-warm-gray-600 leading-relaxed">
                  Try &quot;Make my hero bolder&quot; or &quot;Add testimonials section&quot;
                </p>
              </div>
            </div>
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
