import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getUserPortfolioConfig } from "@/lib/templates/queries";
import { ArrowLeft, FileText } from "lucide-react";
import type { Metadata } from "next";
import { ContentEditor } from "@/components/portfolio/content-editor";

export const metadata: Metadata = {
  title: "Content Editor - Portfolio Editor",
  description: "Edit your portfolio content",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ section?: string }>;
}

async function ContentEditorContent({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const portfolioConfig = await getUserPortfolioConfig(session.user.id);

  if (!portfolioConfig || !portfolioConfig.templateId || !portfolioConfig.template) {
    redirect("/dashboard/portfolio/templates");
  }

  const resolvedParams = await searchParams;
  const initialSection = resolvedParams.section;

  return (
    <div className="max-w-3xl mx-auto">
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
            Content Editor
          </h1>
          <p className="mt-1 text-warm-gray-500">
            Edit headlines, descriptions, and section content
          </p>
        </div>
      </div>

      {/* Content Editor */}
      <ContentEditor
        config={portfolioConfig}
        template={portfolioConfig.template}
        initialSection={initialSection}
      />
    </div>
  );
}

export default function ContentPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 md:p-10">
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-10 w-48 bg-warm-gray-200 rounded mb-4" />
              <div className="h-6 w-72 bg-warm-gray-100 rounded mb-8" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-warm-gray-100 rounded-xl"
                  />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <ContentEditorContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
