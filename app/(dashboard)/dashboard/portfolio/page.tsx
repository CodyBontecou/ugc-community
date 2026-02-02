import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { getUserPortfolioConfig } from "@/lib/templates/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  ArrowLeft,
  Layout,
  Palette,
  FileText,
  Eye,
  ExternalLink,
  Settings,
  Search,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Editor - ugc.community",
  description: "Customize your portfolio",
};

export const dynamic = "force-dynamic";

async function PortfolioEditorContent() {
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

  // If no template selected, redirect to template selection
  if (!portfolioConfig || !portfolioConfig.templateId) {
    redirect("/dashboard/portfolio/templates");
  }

  const template = portfolioConfig.template;
  const subdomain = user?.subdomain;
  const isPublished = portfolioConfig.isPublished;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-warm-gray-100 hover:bg-warm-gray-200 flex items-center justify-center text-warm-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
              Portfolio Editor
            </h1>
            <p className="mt-1 text-warm-gray-500">
              Using {template?.name ?? "Unknown"} template
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {subdomain && (
            <Link
              href={`/creators/${subdomain}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warm-gray-700 bg-white border border-warm-gray-200 rounded-lg hover:bg-warm-gray-50 transition-colors"
            >
              <Eye size={16} />
              Preview
              <ExternalLink size={14} />
            </Link>
          )}
          <Link
            href="/dashboard/portfolio/templates"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warm-gray-700 bg-white border border-warm-gray-200 rounded-lg hover:bg-warm-gray-50 transition-colors"
          >
            <Layout size={16} />
            Change Template
          </Link>
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`mb-6 p-4 rounded-xl border ${
          isPublished
            ? "bg-mint/10 border-mint/30"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isPublished ? "bg-mint" : "bg-amber-400"
              }`}
            />
            <span
              className={`font-medium ${
                isPublished ? "text-mint" : "text-amber-700"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
            {subdomain && (
              <span className="text-sm text-warm-gray-500">
                {isPublished
                  ? `Live at ugc.community/creators/${subdomain}`
                  : "Not visible to public"}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/portfolio/publish"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPublished
                ? "bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200"
                : "bg-coral text-white hover:bg-coral/90"
            }`}
          >
            {isPublished ? "Manage" : "Publish"}
          </Link>
        </div>
      </div>

      {/* Editor Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/portfolio/sections"
          className="group p-6 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center group-hover:bg-coral/20 transition-colors">
              <Layout className="w-6 h-6 text-coral" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 mb-1">
                Section Manager
              </h3>
              <p className="text-sm text-warm-gray-500">
                Reorder sections, toggle visibility, and choose variants for
                Hero, About, Work, and more.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/portfolio/theme"
          className="group p-6 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 mb-1">
                Theme Editor
              </h3>
              <p className="text-sm text-warm-gray-500">
                Customize colors, fonts, spacing, and effects to match your
                brand.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/portfolio/content"
          className="group p-6 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 mb-1">
                Content Editor
              </h3>
              <p className="text-sm text-warm-gray-500">
                Edit headlines, descriptions, testimonials, and other text
                content.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/projects"
          className="group p-6 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 mb-1">
                Manage Projects
              </h3>
              <p className="text-sm text-warm-gray-500">
                Add, edit, or remove portfolio projects displayed in your Work
                section.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/portfolio/seo"
          className="group p-6 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Search className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 mb-1">
                SEO Settings
              </h3>
              <p className="text-sm text-warm-gray-500">
                Optimize how your portfolio appears in search engine results.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 p-6 bg-warm-gray-50 rounded-xl">
        <h3 className="font-semibold text-warm-gray-900 mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-warm-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-coral">•</span>
            Preview your changes before publishing to see exactly how visitors
            will see your portfolio.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral">•</span>
            Your Work section automatically pulls from your Projects. Make sure
            to add some!
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral">•</span>
            You can change templates anytime – your content will be preserved.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function PortfolioEditorPage() {
  return (
    <div className="p-6 md:p-10">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-10 w-48 bg-warm-gray-200 rounded mb-4" />
              <div className="h-6 w-64 bg-warm-gray-100 rounded mb-8" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-warm-gray-100 rounded-xl"
                  />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <PortfolioEditorContent />
      </Suspense>
    </div>
  );
}
