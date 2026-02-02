import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { UnifiedTable } from "@/components/admin/unified-table";
import { GitHubConnection } from "@/components/admin/github-connection";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/admin/questionnaires"
          className="flex items-center gap-4 p-4 bg-white rounded-[--radius-xl] border border-warm-gray-200 hover:border-rose/40 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-rose" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-warm-gray-900">Questionnaires</p>
            <p className="text-sm text-warm-gray-500">Portfolio design preferences</p>
          </div>
          <ArrowRight size={18} className="text-warm-gray-300 group-hover:text-rose transition-colors" />
        </Link>
      </div>

      <UnifiedTable />
      <GitHubConnection />
    </div>
  );
}
