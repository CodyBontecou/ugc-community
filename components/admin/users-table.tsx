"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Shield, ShieldOff, Ban, Pencil, X } from "lucide-react";
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
  const [editingSubdomain, setEditingSubdomain] = useState<User | null>(null);
  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [savingSubdomain, setSavingSubdomain] = useState(false);

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

  function openSubdomainEditor(user: User) {
    setEditingSubdomain(user);
    setSubdomainInput(user.subdomain || "");
    setSubdomainError(null);
  }

  function closeSubdomainEditor() {
    setEditingSubdomain(null);
    setSubdomainInput("");
    setSubdomainError(null);
  }

  async function saveSubdomain() {
    if (!editingSubdomain) return;

    setSavingSubdomain(true);
    setSubdomainError(null);

    try {
      const res = await fetch(`/api/admin/users/${editingSubdomain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: subdomainInput.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update subdomain");
      }

      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingSubdomain.id
            ? { ...u, subdomain: data.user.subdomain }
            : u
        )
      );
      closeSubdomainEditor();
    } catch (err) {
      setSubdomainError(err instanceof Error ? err.message : "Failed to update subdomain");
    } finally {
      setSavingSubdomain(false);
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
                    <button
                      onClick={() => openSubdomainEditor(user)}
                      className="group flex items-center gap-1.5 text-sm hover:text-coral transition-colors"
                    >
                      {user.subdomain ? (
                        <span className="text-warm-gray-600 font-mono group-hover:text-coral">
                          {user.subdomain}
                        </span>
                      ) : (
                        <span className="text-warm-gray-400 group-hover:text-coral">—</span>
                      )}
                      <Pencil size={14} className="text-warm-gray-400 group-hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
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

      {/* Edit Subdomain Dialog */}
      {editingSubdomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeSubdomainEditor}
          />
          <div className="relative bg-white rounded-[--radius-xl] shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
              <h3 className="text-lg font-semibold text-warm-gray-900">
                Edit Subdomain
              </h3>
              <button
                onClick={closeSubdomainEditor}
                className="p-1 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-warm-gray-600 mb-1">
                  User: <span className="font-medium">{editingSubdomain.displayName || editingSubdomain.name}</span>
                </p>
                <p className="text-xs text-warm-gray-500">{editingSubdomain.email}</p>
              </div>
              <div>
                <label
                  htmlFor="subdomain-input"
                  className="block text-sm font-medium text-warm-gray-700 mb-1"
                >
                  Subdomain
                </label>
                <input
                  id="subdomain-input"
                  type="text"
                  value={subdomainInput}
                  onChange={(e) => {
                    setSubdomainInput(e.target.value.toLowerCase());
                    setSubdomainError(null);
                  }}
                  placeholder="username"
                  className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral font-mono"
                />
                <p className="text-xs text-warm-gray-500 mt-1">
                  3-63 characters, lowercase letters, numbers, and hyphens only. Leave empty to remove.
                </p>
                {subdomainError && (
                  <p className="text-xs text-red-600 mt-1">{subdomainError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-warm-gray-200 bg-warm-gray-50 rounded-b-[--radius-xl]">
              <button
                onClick={closeSubdomainEditor}
                disabled={savingSubdomain}
                className="px-4 py-2 text-sm font-medium text-warm-gray-700 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSubdomain}
                disabled={savingSubdomain}
                className="px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral/90 rounded-[--radius-md] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingSubdomain ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
