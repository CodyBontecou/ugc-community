import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { portfolios, portfolioSections } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Settings, Eye, EyeOff, Sparkles } from "lucide-react";
import { PortfolioEditor } from "@/components/dashboard/portfolio-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Portfolio - ugc.community",
  description: "Edit your UGC portfolio",
};

// Force dynamic rendering - portfolio editor needs auth session
export const dynamic = "force-dynamic";

/**
 * Creates a default portfolio for a user if they don't have one
 */
async function createDefaultPortfolio(userId: string, userName?: string) {
  const title = userName ? `${userName}'s Portfolio` : "My Portfolio";

  const [portfolio] = await db
    .insert(portfolios)
    .values({
      userId,
      title,
      tagline: "Creator & Content Specialist",
      templateId: "default",
      portfolioType: "json",
      content: {
        headline: title,
        subheadline: "Creator & Content Specialist",
      },
    })
    .returning();

  // Create default sections
  const defaultSections = [
    {
      portfolioId: portfolio.id,
      type: "hero",
      order: 0,
      content: {
        title: title,
        subtitle: "Welcome to my portfolio",
      },
    },
    {
      portfolioId: portfolio.id,
      type: "about",
      order: 1,
      content: {
        title: "About Me",
        body: "Tell brands about yourself and what makes you unique.",
      },
    },
    {
      portfolioId: portfolio.id,
      type: "work",
      order: 2,
      content: {
        title: "My Work",
        items: [],
      },
    },
    {
      portfolioId: portfolio.id,
      type: "contact",
      order: 3,
      content: {
        title: "Let's Work Together",
        ctaText: "Get in Touch",
      },
    },
  ];

  await db.insert(portfolioSections).values(defaultSections);

  return portfolio;
}

async function PortfolioEditorContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // Get user's portfolio, create if doesn't exist
  let portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.userId, session.user.id),
    with: {
      sections: {
        orderBy: (sections, { asc }) => [asc(sections.order)],
      },
      media: true,
    },
  });

  // Auto-create portfolio if user doesn't have one
  if (!portfolio) {
    await createDefaultPortfolio(session.user.id, session.user.name);
    portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, session.user.id),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.order)],
        },
        media: true,
      },
    });
  }

  if (!portfolio) {
    throw new Error("Failed to create portfolio");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
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
          {portfolio.portfolioType === "html" && portfolio.htmlContent && (
            <Link
              href="/dashboard/portfolio/edit"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-lavender bg-lavender-soft/30 rounded-[--radius-md] hover:bg-lavender-soft/50 transition-colors"
            >
              <Sparkles size={14} />
              AI Edit
            </Link>
          )}

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
            href="/dashboard/settings"
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

export default function PortfolioPage() {
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
      <PortfolioEditorContent />
    </Suspense>
  );
}
