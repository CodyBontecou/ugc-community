"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Trash2,
  MoreVertical,
  Shield,
  ShieldOff,
  Ban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { RecordType, UnifiedRecord } from "@/app/api/admin/people/route";
import type { UserStatus } from "@/lib/admin";

type SortOrder = "newest" | "oldest";

const STATUS_OPTIONS: string[] = ["active", "suspended", "banned"];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-warm-gray-100 text-warm-gray-600";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

export function UnifiedTable() {
  const router = useRouter();
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // UI state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number; flip: boolean } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UnifiedRecord | null>(null);
  const actionButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());


  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch("/api/admin/people");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    let result = records;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((r) => {
        if (r.email.toLowerCase().includes(searchLower)) return true;
        if (r.name?.toLowerCase().includes(searchLower)) return true;
        if (r.subdomain?.toLowerCase().includes(searchLower)) return true;
        if (r.displayName?.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [records, statusFilter, search, sortOrder]);

  // Actions
  async function updateUserStatus(userId: string, status: UserStatus) {
    setUpdating(userId);
    setActionMenuOpen(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      const data = await res.json();
      setRecords((prev) =>
        prev.map((r) =>
          r.id === userId ? { ...r, status: data.user.status } : r
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdating(null);
    }
  }

  function openDeleteDialog(record: UnifiedRecord) {
    setActionMenuOpen(null);
    setUserToDelete(record);
  }

  function handleUserDeleted() {
    if (userToDelete) {
      setRecords((prev) => prev.filter((r) => r.id !== userToDelete.id));
    }
    setUserToDelete(null);
  }

  // Render helpers
  function renderPersonCell(record: UnifiedRecord) {
    return (
      <div className="flex items-center gap-3">
        {record.image ? (
          <img src={record.image} alt={record.name || ""} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-sm font-medium">
            {record.name?.charAt(0) || "U"}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-warm-gray-900">{record.displayName || record.name}</p>
          <p className="text-xs text-warm-gray-500">{record.email}</p>
        </div>
      </div>
    );
  }

  function renderDetailsCell(record: UnifiedRecord) {
    return record.subdomain ? (
      <span className="text-sm text-warm-gray-600 font-mono">{record.subdomain}</span>
    ) : (
      <span className="text-sm text-warm-gray-400">—</span>
    );
  }

  function handleActionMenuToggle(recordId: string) {
    if (actionMenuOpen === recordId) {
      setActionMenuOpen(null);
      setActionMenuPosition(null);
      return;
    }

    // Calculate fixed position based on button location
    const buttonEl = actionButtonRefs.current.get(recordId);
    if (buttonEl) {
      const rect = buttonEl.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px
      const menuHeight = 180; // approximate menu height
      const spaceBelow = window.innerHeight - rect.bottom;
      const flip = spaceBelow < menuHeight + 8;

      setActionMenuPosition({
        top: flip ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: rect.right - menuWidth,
        flip,
      });
    }

    setActionMenuOpen(recordId);
  }

  function renderActionsCell(record: UnifiedRecord) {
    const isUpdating = updating === record.id;

    return (
      <div className="relative">
        <button
          ref={(el) => {
            if (el) actionButtonRefs.current.set(record.id, el);
          }}
          onClick={() => handleActionMenuToggle(record.id)}
          disabled={isUpdating}
          className="p-1 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors disabled:opacity-50"
        >
          {isUpdating ? (
            <span className="w-5 h-5 block border-2 border-warm-gray-300 border-t-warm-gray-600 rounded-full animate-spin" />
          ) : (
            <MoreVertical size={18} />
          )}
        </button>

        {actionMenuOpen === record.id && actionMenuPosition && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setActionMenuOpen(null); setActionMenuPosition(null); }} />
            <div
              className="fixed w-48 bg-white rounded-[--radius-lg] shadow-lg border border-warm-gray-200 py-1 z-50"
              style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
            >
              {record.status !== "active" && (
                <button
                  onClick={() => updateUserStatus(record.id, "active")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  <Shield size={16} />
                  Activate
                </button>
              )}
              {record.status !== "suspended" && (
                <button
                  onClick={() => updateUserStatus(record.id, "suspended")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                >
                  <ShieldOff size={16} />
                  Suspend
                </button>
              )}
              {record.status !== "banned" && (
                <button
                  onClick={() => updateUserStatus(record.id, "banned")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <Ban size={16} />
                  Ban
                </button>
              )}
              <div className="border-t border-warm-gray-200 my-1" />
              <button
                onClick={() => openDeleteDialog(record)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete User
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-warm-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  }

  return (
    <>
      {/* Header with title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-warm-gray-900">Users</h2>
          <p className="text-sm text-warm-gray-500">Manage platform users</p>
        </div>
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        {/* Search and filters */}
        <div className="p-4 border-b border-warm-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or subdomain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-gray-50 border-b border-warm-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Subdomain
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-warm-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-warm-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/admin/users/${record.id}`)}
                  >
                    <td className="px-4 py-3">{renderPersonCell(record)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-gray-600">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{renderDetailsCell(record)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>{renderActionsCell(record)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        <div className="px-4 py-3 border-t border-warm-gray-200 bg-warm-gray-50">
          <p className="text-sm text-warm-gray-500">
            Showing {filteredRecords.length} of {records.length} users
          </p>
        </div>
      </div>

      <DeleteUserDialog
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        onDeleted={handleUserDeleted}
        user={userToDelete ? { id: userToDelete.id, name: userToDelete.name, email: userToDelete.email } : null}
      />
    </>
  );
}
