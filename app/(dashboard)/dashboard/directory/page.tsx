import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { DirectorySettingsForm } from "@/components/dashboard/directory-settings/directory-settings-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Directory Settings - ugc.community",
  description: "Manage your creator directory listing",
};

export const dynamic = "force-dynamic";

export default function DirectorySettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-full bg-warm-gray-100 hover:bg-warm-gray-200 flex items-center justify-center text-warm-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 flex items-center gap-3">
            <Users size={28} className="text-lavender" />
            Directory Settings
          </h1>
          <p className="mt-1 text-warm-gray-500">
            Control how you appear in the{" "}
            <Link href="/creators" className="text-lavender hover:underline">
              creator directory
            </Link>
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-lavender-soft/30 border border-lavender/20 rounded-[--radius-xl] p-6">
        <h2 className="font-semibold text-warm-gray-900 mb-2">
          Get discovered by brands
        </h2>
        <p className="text-sm text-warm-gray-600">
          Join the creator directory to make it easy for brands to find and hire
          you. Your directory listing shows a preview of your profile with a
          link to your full portfolio.
        </p>
      </div>

      {/* Settings Form */}
      <Suspense
        fallback={
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-warm-gray-200 rounded-[--radius-xl]" />
            <div className="h-32 bg-warm-gray-200 rounded-[--radius-xl]" />
            <div className="h-48 bg-warm-gray-200 rounded-[--radius-xl]" />
          </div>
        }
      >
        <DirectorySettingsForm />
      </Suspense>
    </div>
  );
}
