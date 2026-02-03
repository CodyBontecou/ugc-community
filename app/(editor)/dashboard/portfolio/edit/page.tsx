import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { V0Editor } from "@/components/portfolio/interactive-editor/v0-editor";
import type { Metadata } from "next";

// Force dynamic rendering - editor needs auth session
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Portfolio - ugc.community",
  description: "Edit your AI-generated portfolio",
};

async function EditorContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/sign-in");
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.userId, session.user.id),
  });

  if (!portfolio) {
    redirect("/dashboard/portfolio");
  }

  // Only HTML portfolios can use the interactive editor
  if (portfolio.portfolioType !== "html" || !portfolio.htmlContent) {
    // Redirect to the regular editor for JSON portfolios
    redirect("/dashboard/portfolio");
  }

  // Create a slug from username or portfolio id for preview links
  const slug = session.user.username || portfolio.id;

  return (
    <V0Editor
      portfolioId={portfolio.id}
      initialHtml={portfolio.htmlContent}
      portfolioTitle={portfolio.title}
      portfolioSlug={slug}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        username: session.user.username,
      }}
    />
  );
}

export default function PortfolioEditPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666]">Loading editor...</p>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
