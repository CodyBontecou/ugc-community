import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || !isAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Admin Panel
        </h1>
        <p className="mt-1 text-warm-gray-500">
          Manage users, invites, and access control
        </p>
      </div>

      <AdminNav />

      {children}
    </div>
  );
}
