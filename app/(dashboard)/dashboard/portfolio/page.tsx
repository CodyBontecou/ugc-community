import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { getUserPortfolioConfig, getPortfolioData } from "@/lib/templates/queries";
import { db } from "@/lib/db";
import { users, portfolioProjects, portfolioProjectMedia, media } from "@/lib/db/schema";
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
import { PortfolioEditorLayout } from "@/components/portfolio/portfolio-editor-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Editor - ugc.community",
  description: "Customize your portfolio",
};

export const dynamic = "force-dynamic";

async function getPreviewData(userId: string) {
  const portfolioData = await getPortfolioData(userId, { includeUnpublished: true });
  
  if (!portfolioData) {
    return null;
  }

  // Convert Maps to objects for serialization
  const projectCoverMedia: Record<string, typeof portfolioData.projectCoverMedia extends Map<string, infer V> ? V : never> = {};
  for (const [key, value] of portfolioData.projectCoverMedia) {
    projectCoverMedia[key] = value;
  }

  const mediaMap: Record<string, typeof portfolioData.mediaMap extends Map<string, infer V> ? V : never> = {};
  for (const [key, value] of portfolioData.mediaMap) {
    mediaMap[key] = value;
  }

  // Build projects with cover media
  const projectsWithMedia = portfolioData.projects.map((project) => ({
    ...project,
    coverMedia: projectCoverMedia[project.id] ?? null,
  }));

  return {
    user: portfolioData.user,
    config: portfolioData.config,
    template: portfolioData.template,
    projects: projectsWithMedia,
    mediaMap,
  };
}

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

  // Get preview data
  const previewData = await getPreviewData(session.user.id);

  if (!previewData) {
    redirect("/dashboard/portfolio/templates");
  }

  const editorContent = (
    <div className="max-w-3xl mx-auto">
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
            <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
              Portfolio Editor
            </h1>
            <p className="mt-0.5 text-sm text-warm-gray-500">
              Using {template?.name ?? "Unknown"} template
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {subdomain && (
            <Link
              href={`/creators/${subdomain}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-warm-gray-700 bg-white border border-warm-gray-200 rounded-lg hover:bg-warm-gray-50 transition-colors"
            >
              <Eye size={14} />
              Open
              <ExternalLink size={12} />
            </Link>
          )}
          <Link
            href="/dashboard/portfolio/templates"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-warm-gray-700 bg-white border border-warm-gray-200 rounded-lg hover:bg-warm-gray-50 transition-colors"
          >
            <Layout size={14} />
            Change
          </Link>
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`mb-6 p-3 rounded-xl border ${
          isPublished
            ? "bg-mint/10 border-mint/30"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isPublished ? "bg-mint" : "bg-amber-400"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isPublished ? "text-mint" : "text-amber-700"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
            {subdomain && (
              <span className="text-xs text-warm-gray-500">
                {isPublished
                  ? `ugc.community/creators/${subdomain}`
                  : "Not visible to public"}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/portfolio/publish"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link
          href="/dashboard/portfolio/sections"
          className="group p-4 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center group-hover:bg-coral/20 transition-colors">
              <Layout className="w-5 h-5 text-coral" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 text-sm mb-0.5">
                Section Manager
              </h3>
              <p className="text-xs text-warm-gray-500">
                Reorder sections, toggle visibility, choose variants
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/portfolio/theme"
          className="group p-4 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 text-sm mb-0.5">
                Theme Editor
              </h3>
              <p className="text-xs text-warm-gray-500">
                Customize colors, fonts, spacing, effects
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/portfolio/content"
          className="group p-4 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 text-sm mb-0.5">
                Content Editor
              </h3>
              <p className="text-xs text-warm-gray-500">
                Edit headlines, descriptions, testimonials
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/projects"
          className="group p-4 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 text-sm mb-0.5">
                Manage Projects
              </h3>
              <p className="text-xs text-warm-gray-500">
                Add, edit, or remove portfolio projects
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/portfolio/seo"
          className="group p-4 bg-white rounded-xl border border-warm-gray-200 hover:border-coral/50 hover:shadow-md transition-all md:col-span-2"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Search className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-warm-gray-900 text-sm mb-0.5">
                SEO Settings
              </h3>
              <p className="text-xs text-warm-gray-500">
                Optimize how your portfolio appears in search engine results
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-warm-gray-50 rounded-xl">
        <h3 className="font-semibold text-warm-gray-900 text-sm mb-2">Quick Tips</h3>
        <ul className="space-y-1.5 text-xs text-warm-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-coral">•</span>
            The preview updates automatically as you make changes.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral">•</span>
            Use device buttons to see how your portfolio looks on mobile.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral">•</span>
            You can change templates anytime – your content will be preserved.
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <PortfolioEditorLayout initialData={previewData}>
      {editorContent}
    </PortfolioEditorLayout>
  );
}

export default function PortfolioEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <div className="animate-pulse text-warm-gray-400">
            Loading editor...
          </div>
        </div>
      }
    >
      <PortfolioEditorContent />
    </Suspense>
  );
}
