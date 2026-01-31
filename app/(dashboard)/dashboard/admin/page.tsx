import Link from "next/link";
import { Briefcase, FileText, ArrowRight, Sparkles } from "lucide-react";
import { UnifiedTable } from "@/components/admin/unified-table";
import { GitHubConnection } from "@/components/admin/github-connection";
import { MonitoringTrigger } from "@/components/admin/monitoring-trigger";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/admin/jobs"
          className="flex items-center gap-4 p-4 bg-white rounded-[--radius-xl] border border-warm-gray-200 hover:border-coral/40 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center flex-shrink-0">
            <Briefcase size={20} className="text-coral" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-warm-gray-900">Content Jobs</p>
            <p className="text-sm text-warm-gray-500">Manage job listings</p>
          </div>
          <ArrowRight size={18} className="text-warm-gray-300 group-hover:text-coral transition-colors" />
        </Link>

        <Link
          href="/dashboard/admin/applications"
          className="flex items-center gap-4 p-4 bg-white rounded-[--radius-xl] border border-warm-gray-200 hover:border-lavender/40 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-lavender/10 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-lavender" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-warm-gray-900">Applications</p>
            <p className="text-sm text-warm-gray-500">View all job applications</p>
          </div>
          <ArrowRight size={18} className="text-warm-gray-300 group-hover:text-lavender transition-colors" />
        </Link>

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
      <MonitoringTrigger />
      <GitHubConnection />
    </div>
  );
}
