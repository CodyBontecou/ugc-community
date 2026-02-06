import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - ugc.community",
  description: "Your ugc.community dashboard",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function DashboardContent() {
  const session = await getServerSession();
  if (!session) return null;

  return <DashboardShell userName={session.user.name || "Creator"} />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Greeting skeleton */}
            <div>
              <div className="h-10 bg-warm-gray-200 rounded-lg w-48" />
              <div className="h-5 bg-warm-gray-100 rounded w-64 mt-2" />
            </div>

            {/* Tab bar skeleton */}
            <div className="flex gap-6 border-b border-warm-gray-200 pb-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-5 bg-warm-gray-100 rounded w-20"
                />
              ))}
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-[104px] bg-warm-gray-100 rounded-[--radius-lg]"
                />
              ))}
            </div>
            <div className="h-[100px] bg-warm-gray-100 rounded-[--radius-xl]" />
            <div className="h-[140px] bg-warm-gray-100 rounded-[--radius-xl]" />
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
