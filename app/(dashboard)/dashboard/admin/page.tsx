import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { UnifiedTable } from "@/components/admin/unified-table";

export default function AdminPage() {
  return <div className="space-y-6">
    <Link href="/dashboard/admin/opportunities" className="flex items-center gap-4 rounded-[28px] border border-warm-gray-200 bg-white p-5 hover:bg-peach-100">
      <ClipboardCheck size={24} aria-hidden="true" className="shrink-0 text-rose" />
      <div className="min-w-0 flex-1"><p className="font-medium">Review job listings</p><p className="text-sm text-warm-gray-600">Review submissions and collected opportunities, update listings, and check job supply.</p></div>
      <ArrowRight size={18} aria-hidden="true" className="shrink-0" />
    </Link>
    <h2 className="text-2xl">Community accounts</h2>
    <UnifiedTable />
  </div>;
}
