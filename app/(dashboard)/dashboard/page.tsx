import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import {
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
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

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Welcome back, {session.user.name?.split(" ")[0] || "Creator"}
        </h1>
        <p className="mt-1 text-warm-gray-500">
          Manage your portfolio and track your brand opportunities
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-[--radius-xl] p-6 border border-warm-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[--radius-lg] bg-green-100 flex items-center justify-center text-green-600">
              {portfolio?.isPublished ? <Eye size={24} /> : <EyeOff size={24} />}
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-gray-900">
                {portfolio?.isPublished ? "Live" : "Draft"}
              </p>
              <p className="text-sm text-warm-gray-500">Portfolio Status</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[--radius-xl] p-6 border border-warm-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[--radius-lg] bg-lavender-soft/30 flex items-center justify-center text-lavender">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-gray-900">0</p>
              <p className="text-sm text-warm-gray-500">Profile Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <Link
        href="/dashboard/ai-generate"
        className="group bg-gradient-to-br from-lavender to-purple-dark rounded-[--radius-xl] p-6 text-white hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="w-10 h-10 rounded-[--radius-md] bg-white/20 flex items-center justify-center mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              AI Portfolio Generator
            </h3>
            <p className="text-white/80 text-sm">
              Describe your brand and let AI create your portfolio
            </p>
          </div>
          <ArrowRight
            size={20}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </Link>

      {/* Portfolio preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-warm-gray-900">
            Your Portfolio
          </h2>
          {portfolio?.isPublished && session.user.username && (
            <a
              href={`/?subdomain=${session.user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-rose hover:text-rose/80 transition-colors flex items-center gap-1"
            >
              <ExternalLink size={14} />
              View Live
            </a>
          )}
        </div>

        {!portfolio ? (
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-warm-gray-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-warm-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">
              Create your portfolio
            </h3>
            <p className="text-warm-gray-500 mb-6 max-w-sm mx-auto">
              Let AI help you create a stunning portfolio to showcase your work to brands
            </p>
            <Link
              href="/dashboard/ai-generate"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-lavender to-purple-dark text-white font-medium rounded-[--radius-md] hover:shadow-md transition-shadow"
            >
              <Sparkles size={18} />
              Create with AI
            </Link>
          </div>
        ) : portfolio.portfolioType === "json" ? (
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
              <p className="text-sm text-amber-800">
                <strong>Upgrade available:</strong> Regenerate your portfolio with our AI generator for a more stunning design with interactive editing.
              </p>
            </div>
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[--radius-lg] bg-gradient-to-br from-peach-100 to-peach-200 flex items-center justify-center">
                  <Sparkles size={24} className="text-rose" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-warm-gray-900">
                    {portfolio.title}
                  </h3>
                  <p className="text-sm text-warm-gray-500">
                    {portfolio.tagline || "No tagline set"}
                  </p>
                  <p className="text-xs text-warm-gray-400 mt-1">
                    Last updated {new Date(portfolio.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {portfolio.isPublished ? (
                  <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1.5">
                    <Eye size={14} />
                    Published
                  </span>
                ) : (
                  <span className="px-3 py-1.5 text-sm font-medium bg-warm-gray-100 text-warm-gray-600 rounded-full flex items-center gap-1.5">
                    <EyeOff size={14} />
                    Draft
                  </span>
                )}
                <Link
                  href="/dashboard/ai-generate"
                  className="px-4 py-2 bg-gradient-to-br from-lavender to-purple-dark text-white font-medium rounded-[--radius-md] hover:shadow-md transition-shadow text-sm"
                >
                  Regenerate
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/dashboard/portfolio/edit"
            className="block bg-white rounded-[--radius-xl] border border-warm-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
          >
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[--radius-lg] bg-gradient-to-br from-peach-100 to-peach-200 flex items-center justify-center">
                  <Sparkles size={24} className="text-rose" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-warm-gray-900">
                    {portfolio.title}
                  </h3>
                  <p className="text-sm text-warm-gray-500">
                    {portfolio.tagline || "No tagline set"}
                  </p>
                  <p className="text-xs text-warm-gray-400 mt-1">
                    Last updated {new Date(portfolio.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {portfolio.isPublished ? (
                  <span className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1.5">
                    <Eye size={14} />
                    Published
                  </span>
                ) : (
                  <span className="px-3 py-1.5 text-sm font-medium bg-warm-gray-100 text-warm-gray-600 rounded-full flex items-center gap-1.5">
                    <EyeOff size={14} />
                    Draft
                  </span>
                )}
                <ArrowRight size={20} className="text-warm-gray-400" />
              </div>
            </div>
          </Link>
        )}
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
