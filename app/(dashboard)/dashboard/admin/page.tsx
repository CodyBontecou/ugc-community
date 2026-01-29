import { UnifiedTable } from "@/components/admin/unified-table";
import { GitHubConnection } from "@/components/admin/github-connection";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <GitHubConnection />
      <UnifiedTable />
    </div>
  );
}
