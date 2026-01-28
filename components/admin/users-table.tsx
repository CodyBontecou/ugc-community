"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Shield, ShieldOff, Ban } from "lucide-react";
import { UserStatusBadge } from "./user-status-badge";
import type { UserStatus } from "@/lib/admin";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  username: string | null;
  displayName: string | null;
  subdomain: string | null;
  status: UserStatus;
  statusChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

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
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: data.user.status, statusChangedAt: data.user.statusChangedAt }
            : u
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdating(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search === "" ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-12 text-warm-gray-500">Loading users...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">Error: {error}</div>
    );
  }

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-warm-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
          className="px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
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
                Subdomain
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-warm-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-warm-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white text-sm font-medium">
                          {user.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-warm-gray-900">
                          {user.displayName || user.name}
                        </p>
                        <p className="text-xs text-warm-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.subdomain ? (
                      <span className="text-sm text-warm-gray-600 font-mono">
                        {user.subdomain}
                      </span>
                    ) : (
                      <span className="text-sm text-warm-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-warm-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)
                        }
                        disabled={updating === user.id}
                        className="p-1 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors disabled:opacity-50"
                      >
                        {updating === user.id ? (
                          <span className="w-5 h-5 block border-2 border-warm-gray-300 border-t-warm-gray-600 rounded-full animate-spin" />
                        ) : (
                          <MoreVertical size={18} />
                        )}
                      </button>

                      {actionMenuOpen === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-[--radius-lg] shadow-lg border border-warm-gray-200 py-1 z-50">
                            {user.status !== "active" && (
                              <button
                                onClick={() => updateUserStatus(user.id, "active")}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                              >
                                <Shield size={16} />
                                Activate
                              </button>
                            )}
                            {user.status !== "suspended" && (
                              <button
                                onClick={() => updateUserStatus(user.id, "suspended")}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                              >
                                <ShieldOff size={16} />
                                Suspend
                              </button>
                            )}
                            {user.status !== "banned" && (
                              <button
                                onClick={() => updateUserStatus(user.id, "banned")}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Ban size={16} />
                                Ban
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="px-4 py-3 border-t border-warm-gray-200 bg-warm-gray-50">
        <p className="text-sm text-warm-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>
    </div>
  );
}
