"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Copy, Check, Trash2 } from "lucide-react";
import { InviteStatusBadge } from "./invite-status-badge";
import { CreateInviteDialog } from "./create-invite-dialog";

interface Invite {
  id: string;
  token: string;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  url: string;
  creator: { id: string; name: string; email: string } | null;
  usedBy: { id: string; name: string; email: string } | null;
  isExpired: boolean;
  isUsed: boolean;
  isRevoked: boolean;
}

type InviteFilter = "all" | "active" | "used" | "expired" | "revoked";

export function InvitesTable() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InviteFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    try {
      const res = await fetch("/api/admin/invites");
      if (!res.ok) throw new Error("Failed to fetch invites");
      const data = await res.json();
      setInvites(data.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    if (!confirm("Are you sure you want to revoke this invite?")) return;

    setRevoking(inviteId);
    try {
      const res = await fetch(`/api/admin/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke invite");
      }
      const data = await res.json();
      setInvites((prev) =>
        prev.map((inv) =>
          inv.id === inviteId
            ? { ...inv, revokedAt: data.invite.revokedAt, isRevoked: true }
            : inv
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke invite");
    } finally {
      setRevoking(null);
    }
  }

  function copyLink(invite: Invite) {
    navigator.clipboard.writeText(invite.url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      search === "" ||
      invite.email?.toLowerCase().includes(search.toLowerCase()) ||
      invite.creator?.name.toLowerCase().includes(search.toLowerCase()) ||
      invite.usedBy?.name.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "active") return matchesSearch && !invite.isUsed && !invite.isRevoked && !invite.isExpired;
    if (filter === "used") return matchesSearch && invite.isUsed;
    if (filter === "expired") return matchesSearch && invite.isExpired && !invite.isUsed && !invite.isRevoked;
    if (filter === "revoked") return matchesSearch && invite.isRevoked;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-12 text-warm-gray-500">Loading invites...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">Error: {error}</div>
    );
  }

  return (
    <>
      {/* Header with title and create button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-warm-gray-900">Invites</h2>
          <p className="text-sm text-warm-gray-500">Manage invite links for new users</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-full transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Invite
        </button>
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        {/* Search and filters */}
        <div className="p-4 border-b border-warm-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
            />
            <input
              type="text"
              placeholder="Search invites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as InviteFilter)}
            className="px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          >
            <option value="all">All invites</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-gray-50 border-b border-warm-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Invite
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-100">
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-warm-gray-500">
                    No invites found
                  </td>
                </tr>
              ) : (
                filteredInvites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-warm-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-warm-gray-900">
                          {invite.token.slice(0, 16)}...
                        </p>
                        {invite.email ? (
                          <p className="text-xs text-warm-gray-500">
                            For: {invite.email}
                          </p>
                        ) : (
                          <p className="text-xs text-warm-gray-400">Open invite</p>
                        )}
                        {invite.usedBy && (
                          <p className="text-xs text-green-600 mt-1">
                            Used by: {invite.usedBy.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-gray-600">
                      {invite.creator?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <InviteStatusBadge
                        isUsed={invite.isUsed}
                        isExpired={invite.isExpired}
                        isRevoked={invite.isRevoked}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-gray-600">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!invite.isUsed && !invite.isRevoked && (
                          <>
                            <button
                              onClick={() => copyLink(invite)}
                              className="p-2 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors"
                              title="Copy link"
                            >
                              {copiedId === invite.id ? (
                                <Check size={16} className="text-green-600" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => revokeInvite(invite.id)}
                              disabled={revoking === invite.id}
                              className="p-2 text-warm-gray-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                              title="Revoke"
                            >
                              {revoking === invite.id ? (
                                <span className="w-4 h-4 block border-2 border-warm-gray-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
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
            Showing {filteredInvites.length} of {invites.length} invites
          </p>
        </div>
      </div>

      <CreateInviteDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={fetchInvites}
      />
    </>
  );
}
