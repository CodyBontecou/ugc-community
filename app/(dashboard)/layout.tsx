import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-warm-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[--radius-md] bg-gradient-to-br from-coral via-rose to-lavender flex items-center justify-center">
                <span className="font-[family-name:var(--font-display)] text-lg text-white">
                  u
                </span>
              </div>
              <span className="font-semibold text-warm-gray-900">
                ugc.community
              </span>
            </Link>

            <DashboardNav user={session.user} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
