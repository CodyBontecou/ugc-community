import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";
import {
  Plus,
  FolderOpen,
  Eye,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - ugc.community",
  description: "Manage your UGC portfolios",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) return null;

  const userPortfolios = await db.query.portfolios.findMany({
    where: eq(portfolios.userId, session.user.id),
    orderBy: [desc(portfolios.updatedAt)],
    limit: 5,
  });

  const publishedCount = userPortfolios.filter((p) => p.isPublished).length;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Welcome back, {session.user.name?.split(" ")[0] || "Creator"}
        </h1>
        <p className="mt-1 text-warm-gray-500">
          Manage your portfolios and track your brand opportunities
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[--radius-xl] p-6 border border-warm-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[--radius-lg] bg-peach-100 flex items-center justify-center text-rose">
              <FolderOpen size={24} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-gray-900">
                {userPortfolios.length}
              </p>
              <p className="text-sm text-warm-gray-500">Total Portfolios</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[--radius-xl] p-6 border border-warm-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[--radius-lg] bg-green-100 flex items-center justify-center text-green-600">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-gray-900">
                {publishedCount}
              </p>
              <p className="text-sm text-warm-gray-500">Published</p>
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

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/portfolios/new"
          className="group bg-gradient-to-br from-coral to-rose rounded-[--radius-xl] p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-[--radius-md] bg-white/20 flex items-center justify-center mb-4">
                <Plus size={20} />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Create New Portfolio
              </h3>
              <p className="text-white/80 text-sm">
                Start from scratch or use AI to generate your portfolio
              </p>
            </div>
            <ArrowRight
              size={20}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </Link>

        <Link
          href="/dashboard/portfolios/ai-generate"
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
      </div>

      {/* Recent portfolios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-warm-gray-900">
            Recent Portfolios
          </h2>
          {userPortfolios.length > 0 && (
            <Link
              href="/dashboard/portfolios"
              className="text-sm font-medium text-rose hover:text-rose/80 transition-colors"
            >
              View all
            </Link>
          )}
        </div>

        {userPortfolios.length === 0 ? (
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-warm-gray-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={28} className="text-warm-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">
              No portfolios yet
            </h3>
            <p className="text-warm-gray-500 mb-6 max-w-sm mx-auto">
              Create your first portfolio to start showcasing your work to
              brands
            </p>
            <Link
              href="/dashboard/portfolios/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] hover:shadow-md transition-shadow"
            >
              <Plus size={18} />
              Create Portfolio
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 divide-y divide-warm-gray-100">
            {userPortfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                href={`/dashboard/portfolios/${portfolio.id}`}
                className="flex items-center justify-between p-4 hover:bg-warm-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[--radius-md] bg-gradient-to-br from-peach-100 to-peach-200 flex items-center justify-center text-rose">
                    <FolderOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-warm-gray-900">
                      {portfolio.title}
                    </h3>
                    <p className="text-sm text-warm-gray-500">
                      {portfolio.tagline || "No tagline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {portfolio.isPublished ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-warm-gray-100 text-warm-gray-600 rounded-full">
                      Draft
                    </span>
                  )}
                  <ArrowRight size={18} className="text-warm-gray-400" />
                </div>
              </Link>
            ))}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
