import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { MediaLibrary } from "@/components/media/media-library";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { ScheduleCallCard } from "@/components/dashboard/schedule-call-card";
import { CreatorStatsCard } from "@/components/dashboard/creator-stats-card";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import { PostMetrics } from "@/components/dashboard/post-metrics";
import { PortfolioStatus } from "@/components/dashboard/portfolio-status";
import { UserProgressionPath } from "@/components/milestones/UserProgressionPath";
import { RewardsOverview } from "@/components/milestones/RewardsOverview";
import { User, Users, Search, Bookmark, Megaphone, CheckCircle, Circle, ArrowRight, Briefcase } from "lucide-react";
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
            ? "Find and connect with talented UGC creators"
            : "Welcome to your dashboard"}
        </p>
      </div>

      {/* Schedule Call CTA - Creator only */}
      {showCreatorContent && <ScheduleCallCard />}

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

      {/* Jobs CTA - Creator only */}
      {showCreatorContent && (
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
                Browse content creation opportunities from brands and ugc.community.
                Find paid gigs, product collaborations, and more.
              </p>
            </div>
            <ArrowRight size={20} className="text-coral flex-shrink-0 mt-1" />
          </div>
        </Link>
      )}

      {/* Directory CTA - Creator only */}
      {showCreatorContent && (
        <Link
          href="/dashboard/directory"
          className="block bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 hover:border-warm-gray-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-lavender-soft/30 flex items-center justify-center flex-shrink-0">
              <Users size={24} className="text-lavender" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-warm-gray-900 mb-1">
                Creator Directory
              </h2>
              <p className="text-sm text-warm-gray-500">
                Get discovered by brands. Join the creator directory to make it
                easy for brands to find and hire you.
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Brand Dashboard Content */}
      {isUserBrand && (
        <>
          {/* Quick Actions */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/creators"
                className="flex items-center gap-3 p-4 rounded-[--radius-lg] bg-gradient-to-br from-coral/10 to-rose/10 hover:from-coral/20 hover:to-rose/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Search size={20} className="text-coral" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warm-gray-900">Browse Creators</p>
                  <p className="text-xs text-warm-gray-500">Find talent</p>
                </div>
                <ArrowRight size={16} className="text-warm-gray-400 group-hover:text-coral transition-colors" />
              </Link>
              <Link
                href="/dashboard/saved"
                className="flex items-center gap-3 p-4 rounded-[--radius-lg] bg-gradient-to-br from-lavender/10 to-sky/10 hover:from-lavender/20 hover:to-sky/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Bookmark size={20} className="text-lavender" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warm-gray-900">Saved Creators</p>
                  <p className="text-xs text-warm-gray-500">View favorites</p>
                </div>
                <ArrowRight size={16} className="text-warm-gray-400 group-hover:text-lavender transition-colors" />
              </Link>
              <div
                className="flex items-center gap-3 p-4 rounded-[--radius-lg] bg-warm-gray-50 cursor-not-allowed opacity-60"
                title="Coming soon"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Megaphone size={20} className="text-sky" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warm-gray-900">Campaigns</p>
                  <p className="text-xs text-warm-gray-500">Coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started Checklist */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <h2 className="text-lg font-semibold text-warm-gray-900 mb-4">
              Getting Started
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-[--radius-md] bg-green-50">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                <span className="text-sm text-warm-gray-700">Create your account</span>
              </div>
              <Link
                href="/creators"
                className="flex items-center gap-3 p-3 rounded-[--radius-md] bg-warm-gray-50 hover:bg-coral/5 transition-colors group"
              >
                <Circle size={20} className="text-warm-gray-300 flex-shrink-0 group-hover:text-coral" />
                <span className="text-sm text-warm-gray-700 group-hover:text-warm-gray-900">Browse the creator directory</span>
                <ArrowRight size={14} className="text-warm-gray-300 ml-auto group-hover:text-coral" />
              </Link>
              <Link
                href="/creators"
                className="flex items-center gap-3 p-3 rounded-[--radius-md] bg-warm-gray-50 hover:bg-coral/5 transition-colors group"
              >
                <Circle size={20} className="text-warm-gray-300 flex-shrink-0 group-hover:text-coral" />
                <span className="text-sm text-warm-gray-700 group-hover:text-warm-gray-900">Save creators you're interested in</span>
                <ArrowRight size={14} className="text-warm-gray-300 ml-auto group-hover:text-coral" />
              </Link>
              <div className="flex items-center gap-3 p-3 rounded-[--radius-md] bg-warm-gray-50 opacity-60">
                <Circle size={20} className="text-warm-gray-300 flex-shrink-0" />
                <span className="text-sm text-warm-gray-500">Start your first campaign</span>
                <span className="text-xs text-warm-gray-400 ml-auto">Coming soon</span>
              </div>
            </div>
          </div>

          {/* Browse Creators CTA */}
          <Link
            href="/creators"
            className="block bg-gradient-to-r from-coral to-rose rounded-[--radius-xl] p-6 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-1">
                  Discover UGC Creators
                </h2>
                <p className="text-sm text-white/80">
                  Browse our directory of talented creators ready to work with your brand
                </p>
              </div>
              <ArrowRight size={24} className="text-white/80" />
            </div>
          </Link>
        </>
      )}

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
