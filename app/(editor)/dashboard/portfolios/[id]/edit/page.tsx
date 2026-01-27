import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { InteractiveHtmlEditor } from "@/components/portfolio/interactive-editor";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

// Force dynamic rendering - editor needs auth session
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) {
    return { title: "Edit Portfolio - ugc.community" };
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
  });

  return {
    title: portfolio
      ? `Edit ${portfolio.title} | ugc.community`
      : "Portfolio Not Found",
  };
}

async function EditorContent({ id }: { id: string }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/sign-in");
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)),
  });

  if (!portfolio) {
    notFound();
  }

  // Only HTML portfolios can use the interactive editor
  if (portfolio.portfolioType !== "html" || !portfolio.htmlContent) {
    // Redirect to the regular editor for JSON portfolios
    redirect(`/dashboard/portfolios/${id}`);
  }

  // Create a slug from username or portfolio id for preview links
  const slug = session.user.username || portfolio.id;

  return (
    <InteractiveHtmlEditor
      portfolioId={portfolio.id}
      initialHtml={portfolio.htmlContent}
      portfolioTitle={portfolio.title}
      portfolioSlug={slug}
    />
  );
}

export default async function PortfolioEditPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-warm-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-rose border-t-transparent rounded-full animate-spin" />
            <p className="text-warm-gray-500">Loading editor...</p>
          </div>
        </div>
      }
    >
      <EditorContent id={id} />
    </Suspense>
  );
}
