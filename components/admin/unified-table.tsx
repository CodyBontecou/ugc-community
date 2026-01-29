"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  Copy,
  Check,
  Trash2,
  Send,
  Mail,
  MoreVertical,
  Shield,
  ShieldOff,
  Ban,
  Pencil,
  X,
  Instagram,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { RecordTypeBadge } from "./record-type-badge";
import { CreateInviteDialog } from "./create-invite-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { RecordType, UnifiedRecord } from "@/app/api/admin/people/route";
import type { UserStatus } from "@/lib/admin";

type TypeFilter = "all" | RecordType;
type SortOrder = "newest" | "oldest";

const STATUS_OPTIONS: Record<RecordType, string[]> = {
  user: ["active", "suspended", "banned"],
  invite: ["active", "used", "expired", "revoked"],
  waitlist: ["pending", "invited"],
};

const STATUS_STYLES: Record<string, string> = {
  // User statuses
  active: "bg-green-100 text-green-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
  // Invite statuses
  used: "bg-green-100 text-green-700",
  revoked: "bg-red-100 text-red-700",
  expired: "bg-warm-gray-100 text-warm-gray-600",
  // Waitlist statuses
  pending: "bg-amber-100 text-amber-700",
  invited: "bg-green-100 text-green-700",
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number; flip: boolean } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UnifiedRecord | null>(null);
  const actionButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Subdomain editor state
  const [editingSubdomain, setEditingSubdomain] = useState<UnifiedRecord | null>(null);
  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [savingSubdomain, setSavingSubdomain] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  // Reset status filter when type filter changes
  useEffect(() => {
    setStatusFilter("all");
  }, [typeFilter]);

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

  // Get available status options based on current type filter
  const availableStatuses = useMemo(() => {
    if (typeFilter === "all") {
      return [...new Set(Object.values(STATUS_OPTIONS).flat())];
    }
    return STATUS_OPTIONS[typeFilter];
  }, [typeFilter]);

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    let result = records;

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((r) => r.type === typeFilter);
    }

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
        if (r.socials) {
          const socials = r.socials;
          if (socials.instagram?.toLowerCase().includes(searchLower)) return true;
          if (socials.tiktok?.toLowerCase().includes(searchLower)) return true;
          if (socials.youtube?.toLowerCase().includes(searchLower)) return true;
          if (socials.facebook?.toLowerCase().includes(searchLower)) return true;
          if (socials.twitter?.toLowerCase().includes(searchLower)) return true;
        }
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
  }, [records, typeFilter, statusFilter, search, sortOrder]);

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
          r.id === userId && r.type === "user" ? { ...r, status: data.user.status } : r
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
      setRecords((prev) => prev.filter((r) => !(r.id === userToDelete.id && r.type === "user")));
    }
    setUserToDelete(null);
  }

  async function revokeInvite(inviteId: string) {
    if (!confirm("Are you sure you want to revoke this invite?")) return;

    setUpdating(inviteId);
    setActionMenuOpen(null);
    try {
      const res = await fetch(`/api/admin/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke invite");
      }
      setRecords((prev) =>
        prev.map((r) => (r.id === inviteId && r.type === "invite" ? { ...r, status: "revoked" } : r))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke invite");
    } finally {
      setUpdating(null);
    }
  }

  async function resendInviteEmail(inviteId: string) {
    setUpdating(inviteId);
    try {
      const res = await fetch(`/api/admin/invites/${inviteId}/resend`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resend email");
      }
      alert("Invitation email sent successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resend email");
    } finally {
      setUpdating(null);
    }
  }

  async function sendWaitlistInvite(record: UnifiedRecord) {
    setUpdating(record.id);
    try {
      // Create invite
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: record.email,
          expirationDays: 7,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invite");
      }

      // Mark as invited
      const markRes = await fetch(`/api/admin/waitlist/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markInvited: true }),
      });

      if (markRes.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === record.id && r.type === "waitlist" ? { ...r, status: "invited" } : r))
        );
      }

      // Refresh to get new invite in the list
      fetchRecords();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setUpdating(null);
    }
  }

  function copyLink(record: UnifiedRecord) {
    if (record.inviteUrl) {
      navigator.clipboard.writeText(record.inviteUrl);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function openSubdomainEditor(record: UnifiedRecord) {
    setEditingSubdomain(record);
    setSubdomainInput(record.subdomain || "");
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
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingSubdomain.id && r.type === "user" ? { ...r, subdomain: data.user.subdomain } : r
        )
      );
      closeSubdomainEditor();
    } catch (err) {
      setSubdomainError(err instanceof Error ? err.message : "Failed to update subdomain");
    } finally {
      setSavingSubdomain(false);
    }
  }

  // Render helpers
  function renderPersonCell(record: UnifiedRecord) {
    if (record.type === "user") {
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

    // Invites and waitlist - just show email
    return (
      <div>
        <p className="text-sm font-mono text-warm-gray-900">{record.email}</p>
        {record.type === "invite" && record.usedBy && (
          <p className="text-xs text-green-600">Used by: {record.usedBy.name}</p>
        )}
        {record.type === "invite" && record.creator && (
          <p className="text-xs text-warm-gray-500">Created by: {record.creator.name}</p>
        )}
      </div>
    );
  }

  function renderDetailsCell(record: UnifiedRecord) {
    if (record.type === "user") {
      return (
        <button
          onClick={() => openSubdomainEditor(record)}
          className="group flex items-center gap-1.5 text-sm hover:text-coral transition-colors"
        >
          {record.subdomain ? (
            <span className="text-warm-gray-600 font-mono group-hover:text-coral">{record.subdomain}</span>
          ) : (
            <span className="text-warm-gray-400 group-hover:text-coral">—</span>
          )}
          <Pencil
            size={14}
            className="text-warm-gray-400 group-hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>
      );
    }

    if (record.type === "invite") {
      return (
        <span className="text-sm text-warm-gray-600">
          Expires: {new Date(record.expiresAt!).toLocaleDateString()}
        </span>
      );
    }

    if (record.type === "waitlist" && record.socials) {
      const { instagram, tiktok, youtube, facebook, twitter } = record.socials;
      const hasSocials = instagram || tiktok || youtube || facebook || twitter;

      if (!hasSocials) {
        return <span className="text-xs text-warm-gray-400">No socials</span>;
      }

      return (
        <div className="flex items-center gap-2">
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-gray-400 hover:text-pink-500 transition-colors"
              title={`@${instagram}`}
            >
              <Instagram size={16} />
            </a>
          )}
          {tiktok && (
            <a
              href={`https://tiktok.com/@${tiktok}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-gray-400 hover:text-black transition-colors"
              title={`@${tiktok}`}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          )}
          {youtube && (
            <a
              href={`https://youtube.com/@${youtube}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-gray-400 hover:text-red-500 transition-colors"
              title={`@${youtube}`}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          )}
          {facebook && (
            <a
              href={`https://facebook.com/${facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-gray-400 hover:text-blue-600 transition-colors"
              title={facebook}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          )}
          {twitter && (
            <a
              href={`https://twitter.com/${twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-gray-400 hover:text-black transition-colors"
              title={`@${twitter}`}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
        </div>
      );
    }

    return null;
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

    if (record.type === "user") {
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

    if (record.type === "invite") {
      const isActive = record.status === "active";
      const hasEmail = !!record.email;
      return (
        <div className="flex items-center justify-end gap-1">
          {isActive && (
            <>
              {hasEmail && (
                <button
                  onClick={() => resendInviteEmail(record.id)}
                  disabled={isUpdating}
                  className="p-2 text-warm-gray-400 hover:text-coral rounded transition-colors disabled:opacity-50"
                  title="Resend email"
                >
                  {isUpdating ? (
                    <span className="w-4 h-4 block border-2 border-warm-gray-300 border-t-coral rounded-full animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                </button>
              )}
              <button
                onClick={() => copyLink(record)}
                className="p-2 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors"
                title="Copy link"
              >
                {copiedId === record.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
              <button
                onClick={() => revokeInvite(record.id)}
                disabled={isUpdating}
                className="p-2 text-warm-gray-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                title="Revoke"
              >
                {isUpdating ? (
                  <span className="w-4 h-4 block border-2 border-warm-gray-300 border-t-red-600 rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </>
          )}
        </div>
      );
    }

    if (record.type === "waitlist" && record.status === "pending") {
      return (
        <button
          onClick={() => sendWaitlistInvite(record)}
          disabled={isUpdating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#1A1614", color: "#FFFFFF" }}
          title="Send invite"
        >
          {isUpdating ? (
            <span className="w-4 h-4 block border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Invite
        </button>
      );
    }

    return null;
  }

  if (loading) {
    return <div className="text-center py-12 text-warm-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  }

  const typeFilterTabs: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "user", label: "Users" },
    { value: "invite", label: "Invites" },
    { value: "waitlist", label: "Waitlist" },
  ];

  return (
    <>
      {/* Header with title and create button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-warm-gray-900">People</h2>
          <p className="text-sm text-warm-gray-500">Manage users, invites, and waitlist</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full transition-colors shadow-sm"
          style={{ backgroundColor: "#1A1614", color: "#FFFFFF" }}
        >
          <Plus size={18} />
          Create Invite
        </button>
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        {/* Type filter tabs */}
        <div className="flex border-b border-warm-gray-200">
          {typeFilterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                typeFilter === tab.value
                  ? "text-coral border-b-2 border-coral -mb-px"
                  : "text-warm-gray-500 hover:text-warm-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-warm-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or handle..."
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
            {availableStatuses.map((status) => (
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
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Person
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-warm-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={`${record.type}-${record.id}`}
                    className={`hover:bg-warm-gray-50 ${record.type === "user" ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (record.type === "user") {
                        router.push(`/dashboard/admin/users/${record.id}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <RecordTypeBadge type={record.type} />
                    </td>
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
            Showing {filteredRecords.length} of {records.length} records
          </p>
        </div>
      </div>

      {/* Edit Subdomain Dialog */}
      {editingSubdomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeSubdomainEditor} />
          <div className="relative bg-white rounded-[--radius-xl] shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
              <h3 className="text-lg font-semibold text-warm-gray-900">Edit Subdomain</h3>
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
                <label htmlFor="subdomain-input" className="block text-sm font-medium text-warm-gray-700 mb-1">
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
                {subdomainError && <p className="text-xs text-red-600 mt-1">{subdomainError}</p>}
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

      <CreateInviteDialog isOpen={showCreateDialog} onClose={() => setShowCreateDialog(false)} onCreated={fetchRecords} />

      <DeleteUserDialog
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        onDeleted={handleUserDeleted}
        user={userToDelete ? { id: userToDelete.id, name: userToDelete.name, email: userToDelete.email } : null}
      />
    </>
  );
}
