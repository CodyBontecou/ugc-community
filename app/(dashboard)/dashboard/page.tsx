import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { CreatorStatsCard } from "@/components/dashboard/creator-stats-card";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import { PostMetrics } from "@/components/dashboard/post-metrics";
import { PortfolioStatus } from "@/components/dashboard/portfolio-status";
import { UserProgressionPath } from "@/components/milestones/UserProgressionPath";
import { RewardsOverview } from "@/components/milestones/RewardsOverview";
import { User, ArrowRight, Briefcase } from "lucide-react";
import type { Metadata } from "next";
import { MediaLibrary } from "@/components/media/media-library";

export const metadata: Metadata = {
  title: "Dashboard - ugc.community",
  description: "Your ugc.community dashboard",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) return null;

  const firstName = session.user.name?.split(" ")[0] || "Creator";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
          Hey {firstName}!
        </h1>
        <p className="text-lg text-warm-gray-500">
          Welcome to your dashboard
        </p>
      </div>

      {/* Onboarding Form */}
      <OnboardingForm />

      {/* Creator Stats */}
      <CreatorStatsCard />

      {/* Advanced Analytics */}
      <AdvancedAnalytics />

      {/* Post Performance Metrics */}
      <PostMetrics />

      {/* Milestone Progress */}
      <div id="milestone-progress">
        <UserProgressionPath />
      </div>

      {/* Portfolio Hosting Status */}
      <PortfolioStatus />

      {/* Unlocked Rewards */}
      <RewardsOverview />

      {/* Jobs CTA */}
      <Link
        href="/dashboard/jobs"
        className="block bg-gradient-to-r from-coral/5 to-rose/5 rounded-[--radius-xl] border border-coral/20 p-6 hover:border-coral/40 hover:shadow-sm transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center flex-shrink-0">
            <Briefcase size={24} className="text-coral" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-warm-gray-900 mb-1">
              Content Jobs
            </h2>
            <p className="text-sm text-warm-gray-500">
              Browse active content jobs. Create content using the specified hooks
              and we'll automatically track your contributions.
            </p>
          </div>
          <ArrowRight size={20} className="text-coral flex-shrink-0 mt-1" />
        </div>
      </Link>

      {/* Account Section */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
          Account
        </h2>
        <div className="flex items-center gap-4 mb-6">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || ""}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-xl font-semibold">
              {session.user.name?.charAt(0) || <User size={24} />}
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-warm-gray-900">
              {session.user.name}
            </h3>
            <p className="text-sm text-warm-gray-500">{session.user.email}</p>
          </div>
        </div>
        <div className="pt-4 border-t border-warm-gray-100">
          <SignOutButton />
        </div>
      </div>

      {/* Media Library Section */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        <div className="h-[600px] relative">
          <MediaLibrary />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
          <div className="h-12 bg-warm-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-48 bg-warm-gray-200 rounded-[--radius-xl]" />
          <div className="h-64 bg-warm-gray-200 rounded-[--radius-xl]" />
          <div className="h-96 bg-warm-gray-200 rounded-[--radius-xl]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
