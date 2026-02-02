import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { getUserPortfolioConfig } from "@/lib/templates/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ArrowLeft, Search } from "lucide-react";
import type { Metadata } from "next";
import { SeoEditor } from "@/components/portfolio/seo-editor";

export const metadata: Metadata = {
  title: "SEO Settings - Portfolio Editor",
  description: "Optimize your portfolio for search engines",
};

export const dynamic = "force-dynamic";

async function SeoEditorContent() {
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
            SEO Settings
          </h1>
          <p className="mt-1 text-warm-gray-500">
            Optimize how your portfolio appears in search results
          </p>
        </div>
      </div>

      {/* SEO Editor */}
      <SeoEditor
        config={portfolioConfig}
        subdomain={user?.subdomain ?? null}
      />
    </div>
  );
}

export default function SeoPage() {
  return (
    <div className="p-6 md:p-10">
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-10 w-40 bg-warm-gray-200 rounded mb-4" />
              <div className="h-6 w-64 bg-warm-gray-100 rounded mb-8" />
              <div className="h-64 bg-warm-gray-100 rounded-xl" />
            </div>
          </div>
        }
      >
        <SeoEditorContent />
      </Suspense>
    </div>
  );
}
