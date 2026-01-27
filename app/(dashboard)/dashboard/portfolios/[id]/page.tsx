import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Settings, Eye, EyeOff } from "lucide-react";
import { PortfolioEditor } from "@/components/dashboard/portfolio-editor";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

// Force dynamic rendering - portfolio editor needs auth session
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) {
    return { title: "Portfolio - ugc.community" };
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
  });

  return {
    title: portfolio
      ? `${portfolio.title} - Edit | ugc.community`
      : "Portfolio Not Found",
  };
}

async function PortfolioEditorContent({ id }: { id: string }) {
  const session = await getServerSession();
  if (!session) return null;

  const portfolio = await db.query.portfolios.findFirst({
    where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
    with: {
      sections: {
        orderBy: (sections, { asc }) => [asc(sections.order)],
      },
      media: true,
    },
  });

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/portfolios"
            className="p-2 text-warm-gray-500 hover:text-warm-gray-900 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-warm-gray-900">
              {portfolio.title}
            </h1>
            <p className="text-sm text-warm-gray-500">
              {portfolio.tagline || "No tagline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {portfolio.isPublished ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-full">
              <Eye size={14} />
              Published
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-warm-gray-100 text-warm-gray-600 rounded-full">
              <EyeOff size={14} />
              Draft
            </span>
          )}

          {session.user.username && portfolio.isPublished && (
            <a
              href={`/?subdomain=${session.user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-warm-gray-700 bg-white border border-warm-gray-200 rounded-[--radius-md] hover:bg-warm-gray-50 transition-colors"
            >
              <ExternalLink size={14} />
              View Live
            </a>
          )}

          <Link
            href={`/dashboard/portfolios/${id}/settings`}
            className="p-2 text-warm-gray-500 hover:text-warm-gray-900 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* Editor */}
      <PortfolioEditor portfolio={portfolio} />
    </div>
  );
}

export default async function PortfolioEditPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-warm-gray-200 rounded-[--radius-md]" />
            <div className="space-y-2">
              <div className="h-6 bg-warm-gray-200 rounded w-48" />
              <div className="h-4 bg-warm-gray-200 rounded w-32" />
            </div>
          </div>
          <div className="h-[500px] bg-warm-gray-200 rounded-[--radius-xl]" />
        </div>
      }
    >
      <PortfolioEditorContent id={id} />
    </Suspense>
  );
}
