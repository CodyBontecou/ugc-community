import { Suspense } from "react";
import { InvitesTable } from "@/components/admin/invites-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invites - Admin - ugc.community",
  description: "Manage invites",
};

export const dynamic = "force-dynamic";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        <div className="p-4 border-b border-warm-gray-200 flex items-center justify-between">
          <div className="h-10 bg-warm-gray-100 rounded-[--radius-md] w-64" />
          <div className="h-10 bg-warm-gray-100 rounded-full w-32" />
        </div>
        <div className="divide-y divide-warm-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-warm-gray-100 rounded w-48" />
                <div className="h-3 bg-warm-gray-100 rounded w-32" />
              </div>
              <div className="h-6 bg-warm-gray-100 rounded-full w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminInvitesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <InvitesTable />
    </Suspense>
  );
}
