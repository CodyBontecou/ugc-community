import { UnifiedTable } from "@/components/admin/unified-table";
import { GitHubConnection } from "@/components/admin/github-connection";
import { MonitoringTrigger } from "@/components/admin/monitoring-trigger";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <UnifiedTable />
      <MonitoringTrigger />
      <GitHubConnection />
    </div>
  );
}
