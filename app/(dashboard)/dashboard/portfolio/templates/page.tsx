import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getActiveTemplates, getUserPortfolioConfig } from "@/lib/templates/queries";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { TemplateSelector } from "./template-selector";

export const metadata: Metadata = {
  title: "Choose Template - ugc.community",
  description: "Select a template for your portfolio",
};

export const dynamic = "force-dynamic";

async function TemplateSelectorContent() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [templates, portfolioConfig] = await Promise.all([
    getActiveTemplates(),
    getUserPortfolioConfig(session.user.id),
  ]);

  const currentTemplateId = portfolioConfig?.templateId ?? null;
  const hasExistingConfig = !!portfolioConfig;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={hasExistingConfig ? "/dashboard/portfolio" : "/dashboard"}
          className="w-10 h-10 rounded-full bg-warm-gray-100 hover:bg-warm-gray-200 flex items-center justify-center text-warm-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
            {hasExistingConfig ? "Change Template" : "Choose Your Template"}
          </h1>
          <p className="mt-1 text-warm-gray-500">
            {hasExistingConfig
              ? "Select a new template. Your content will be preserved."
              : "Select a template to start building your portfolio."}
          </p>
        </div>
      </div>

      {/* Warning if changing */}
      {hasExistingConfig && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Changing templates will keep your content but
            may affect how it&apos;s displayed. Some section variants may render
            differently.
          </p>
        </div>
      )}

      {/* Template Grid */}
      <TemplateSelector
        templates={templates}
        currentTemplateId={currentTemplateId}
      />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <div className="p-6 md:p-10">
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse">
              <div className="h-10 w-64 bg-warm-gray-200 rounded mb-4" />
              <div className="h-6 w-96 bg-warm-gray-100 rounded mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[4/3] bg-warm-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <TemplateSelectorContent />
      </Suspense>
    </div>
  );
}
