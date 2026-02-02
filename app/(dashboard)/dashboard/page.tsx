import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { MediaLibrary } from "@/components/media/media-library";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { CreatorStatsCard } from "@/components/dashboard/creator-stats-card";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import { PostMetrics } from "@/components/dashboard/post-metrics";
import { PortfolioStatus } from "@/components/dashboard/portfolio-status";
import { UserProgressionPath } from "@/components/milestones/UserProgressionPath";
import { RewardsOverview } from "@/components/milestones/RewardsOverview";
import { User } from "lucide-react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isBrand } from "@/lib/roles";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Dashboard - ugc.community",
  description: "Your ugc.community dashboard",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) return null;

  // Fetch user role
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const userRole = user[0]?.role || "creator";
  const isUserBrand = isBrand(userRole);
  const isUserAdmin = isAdmin(session.user.email);
  // Only show creator content for actual creators (not brands or admins)
  const showCreatorContent = !isUserBrand && !isUserAdmin;

  const firstName = session.user.name?.split(" ")[0] || "Creator";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
          Hey {firstName}!
        </h1>
        <p className="text-lg text-warm-gray-500">
          {isUserBrand
            ? "Manage your brand dashboard"
            : "Welcome to your dashboard"}
        </p>
      </div>

      {/* Onboarding Form - Creator only */}
      {showCreatorContent && <OnboardingForm />}

      {/* Creator Stats - Creator only */}
      {showCreatorContent && <CreatorStatsCard />}

      {/* Advanced Analytics - Creator only */}
      {showCreatorContent && <AdvancedAnalytics />}

      {/* Post Performance Metrics - Creator only */}
      {showCreatorContent && <PostMetrics />}

      {/* Milestone Progress - Creator only */}
      {showCreatorContent && (
        <div id="milestone-progress">
          <UserProgressionPath />
        </div>
      )}

      {/* Portfolio Hosting Status - Creator only */}
      {showCreatorContent && <PortfolioStatus />}

      {/* Unlocked Rewards - Creator only */}
      {showCreatorContent && <RewardsOverview />}

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

      {/* Media Library Section - Creator only */}
      {showCreatorContent && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
          <div className="h-[600px] relative">
            <MediaLibrary />
          </div>
        </div>
      )}
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
