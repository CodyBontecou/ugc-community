import { Suspense } from "react";
import { getServerSession } from "@/lib/auth/session";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { DeleteAccountButton } from "@/components/dashboard/delete-account-button";
import { PortfolioStatus } from "@/components/dashboard/portfolio-status";
import { User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - ugc.community",
  description: "Manage your account settings",
};

export const dynamic = "force-dynamic";

async function SettingsContent() {
  const session = await getServerSession();
  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-warm-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
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
            <h2 className="text-lg font-medium text-warm-gray-900">
              {session.user.name}
            </h2>
            <p className="text-sm text-warm-gray-500">{session.user.email}</p>
          </div>
        </div>


      </div>

      {/* Portfolio Hosting Status */}
      <PortfolioStatus />

      {/* Sign out */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <h3 className="font-medium text-warm-gray-900 mb-2">Sign Out</h3>
        <p className="text-sm text-warm-gray-500 mb-4">
          Sign out of your account on this device.
        </p>
        <SignOutButton />
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-[--radius-xl] border border-red-200 p-6">
        <h3 className="font-medium text-warm-gray-900 mb-2">Delete Account</h3>
        <p className="text-sm text-warm-gray-500 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <DeleteAccountButton 
          userName={session.user.name} 
          userEmail={session.user.email} 
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-8 max-w-2xl mx-auto">
          <div className="h-12 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-48 bg-warm-gray-200 rounded-[--radius-xl]" />
          <div className="h-32 bg-warm-gray-200 rounded-[--radius-xl]" />
          <div className="h-32 bg-warm-gray-200 rounded-[--radius-xl]" />
          <div className="h-32 bg-warm-gray-200 rounded-[--radius-xl]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
