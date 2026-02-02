import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getUserPortfolioConfig } from "@/lib/templates/queries";
import { ArrowLeft, Palette } from "lucide-react";
import type { Metadata } from "next";
import { ThemeEditor } from "@/components/portfolio/theme-editor";

export const metadata: Metadata = {
  title: "Theme Editor - Portfolio Editor",
  description: "Customize your portfolio theme",
};

export const dynamic = "force-dynamic";

async function ThemeEditorContent() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const portfolioConfig = await getUserPortfolioConfig(session.user.id);

  if (!portfolioConfig || !portfolioConfig.templateId || !portfolioConfig.template) {
    redirect("/dashboard/portfolio/templates");
  }

  return (
    <div className="max-w-4xl mx-auto">
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
            Theme Editor
          </h1>
          <p className="mt-1 text-warm-gray-500">
            Customize colors, fonts, spacing, and effects
          </p>
        </div>
      </div>

      {/* Theme Editor */}
      <ThemeEditor
        config={portfolioConfig}
        template={portfolioConfig.template}
      />
    </div>
  );
}

export default function ThemePage() {
  return (
    <div className="p-6 md:p-10">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-10 w-48 bg-warm-gray-200 rounded mb-4" />
              <div className="h-6 w-72 bg-warm-gray-100 rounded mb-8" />
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 bg-warm-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <ThemeEditorContent />
      </Suspense>
    </div>
  );
}
