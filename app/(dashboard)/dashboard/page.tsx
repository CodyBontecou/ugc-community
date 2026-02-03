import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import type { Metadata } from "next";
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

  const isUserAdmin = isAdmin(session.user.email);
  // Show creator content for everyone except admins
  const showCreatorContent = !isUserAdmin;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-warm-gray-500">
          Welcome back! Track your progress and manage your creator journey
        </p>
      </div>

      {/* Onboarding Slides */}
      {showCreatorContent && <OnboardingForm />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
          <div className="h-12 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-[500px] bg-warm-gray-200 rounded-[--radius-xl]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
