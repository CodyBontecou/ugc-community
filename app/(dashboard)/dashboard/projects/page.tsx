import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { ProjectsManager } from "@/components/portfolio";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects - ugc.community",
  description: "Manage your portfolio projects",
};

// Force dynamic rendering - dashboard needs auth session
export const dynamic = "force-dynamic";

async function ProjectsContent() {
  const session = await getServerSession();
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ProjectsManager />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="text-purple-500 animate-spin" />
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
