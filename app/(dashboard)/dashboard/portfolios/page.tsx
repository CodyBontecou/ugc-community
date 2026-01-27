import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";
import {
  Plus,
  FolderOpen,
  ArrowRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolios - ugc.community",
  description: "Manage your UGC portfolios",
};

// Force dynamic rendering - portfolios page needs auth session
export const dynamic = "force-dynamic";

async function PortfoliosContent() {
  const session = await getServerSession();
  if (!session) return null;

  const userPortfolios = await db.query.portfolios.findMany({
    where: eq(portfolios.userId, session.user.id),
    orderBy: [desc(portfolios.updatedAt)],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            My Portfolios
          </h1>
          <p className="text-warm-gray-500">
            Create and manage your UGC portfolios
          </p>
        </div>
        <Link
          href="/dashboard/portfolios/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] hover:shadow-md transition-shadow"
        >
          <Plus size={18} />
          New Portfolio
        </Link>
      </div>

      {/* Portfolio grid */}
      {userPortfolios.length === 0 ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-warm-gray-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={28} className="text-warm-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">
            No portfolios yet
          </h3>
          <p className="text-warm-gray-500 mb-6 max-w-sm mx-auto">
            Create your first portfolio to start showcasing your work to brands
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="group bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Preview area */}
              <div className="aspect-[4/3] bg-gradient-to-br from-peach-100 to-cream p-4 relative">
                <div className="w-full h-full rounded-[--radius-lg] bg-white shadow-sm flex items-center justify-center">
                  <FolderOpen size={32} className="text-warm-gray-300" />
                </div>

                {/* Quick actions overlay */}
                <div className="absolute inset-0 bg-warm-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link
                    href={`/dashboard/portfolios/${portfolio.id}`}
                    className="p-2 bg-white rounded-full text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </Link>
                  {portfolio.isPublished && (
                    <a
                      href={`/?subdomain=${session.user.username || portfolio.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full text-warm-gray-700 hover:bg-warm-gray-50 transition-colors"
                      title="View live"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-warm-gray-900 truncate">
                    {portfolio.title}
                  </h3>
                  {portfolio.isPublished ? (
                    <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Published
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-warm-gray-100 text-warm-gray-600 rounded-full">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-warm-gray-500 truncate mb-3">
                  {portfolio.tagline || "No tagline"}
                </p>
                <div className="flex items-center justify-between text-xs text-warm-gray-400">
                  <span>
                    Updated {new Date(portfolio.updatedAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/dashboard/portfolios/${portfolio.id}`}
                    className="text-rose hover:text-rose/80 font-medium transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* New portfolio card */}
          <Link
            href="/dashboard/portfolios/new"
            className="group bg-warm-gray-50 rounded-[--radius-xl] border-2 border-dashed border-warm-gray-200 hover:border-rose hover:bg-peach-100/30 transition-colors flex flex-col items-center justify-center min-h-[280px]"
          >
            <div className="w-14 h-14 rounded-full bg-warm-gray-100 group-hover:bg-rose/10 flex items-center justify-center text-warm-gray-400 group-hover:text-rose transition-colors mb-3">
              <Plus size={24} />
            </div>
            <span className="font-medium text-warm-gray-600 group-hover:text-rose transition-colors">
              Create New
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PortfoliosPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="h-10 bg-warm-gray-200 rounded w-48" />
            <div className="h-10 bg-warm-gray-200 rounded w-36" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 bg-warm-gray-200 rounded-[--radius-xl]"
              />
            ))}
          </div>
        </div>
      }
    >
      <PortfoliosContent />
    </Suspense>
  );
}
