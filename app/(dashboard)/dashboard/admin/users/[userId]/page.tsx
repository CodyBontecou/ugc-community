"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  User,
  Globe,
  Instagram,
  Youtube,
  ExternalLink,
  Shield,
  ShieldOff,
  Ban,
  Clock,
  UserPlus,
  CheckCircle,
  Users,
  XCircle,
  Send,
  Eye,
  Server,
  Power,
  PowerOff,
  Loader2,
  HelpCircle,
  Github,
  Search,
  Lock,
  Unlock,
  X,
  ChevronDown,
} from "lucide-react";

interface UserDetails {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  twitterHandle: string | null;
  subdomain: string | null;
  status: string;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  profileViewCount: number;
  vercelProjectId: string | null;
  siteEnabled: boolean;
  githubRepoFullName: string | null;
  githubRepoId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  updated_at: string;
}

interface AdminGitHubStatus {
  connected: boolean;
  username: string | null;
}

interface InviteDetails {
  id: string;
  email: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
  createdBy: string;
  revokedAt: string | null;
  creator: {
    id: string;
    name: string;
    email: string;
  } | null;
  isUsedByThisUser: boolean;
}

interface WaitlistEntry {
  id: string;
  email: string;
  createdAt: string;
  invitedAt: string | null;
  invitedBy: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  twitterHandle: string | null;
  facebookHandle: string | null;
  invitedByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface StatusChangedByUser {
  id: string;
  name: string;
  email: string;
}

interface TimelineEvent {
  id: string;
  type: "waitlist_joined" | "waitlist_invited" | "invite_sent" | "invite_used" | "invite_expired" | "invite_revoked" | "account_created" | "status_changed" | "last_updated";
  date: Date;
  data: Record<string, unknown>;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return formatDate(dateString);
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { bg: "bg-green-100", text: "text-green-800", icon: Shield },
    suspended: { bg: "bg-amber-100", text: "text-amber-800", icon: ShieldOff },
    banned: { bg: "bg-red-100", text: "text-red-800", icon: Ban },
  }[status] || { bg: "bg-gray-100", text: "text-gray-800", icon: Shield };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <Icon size={14} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function InviteStatusBadge({ invite }: { invite: InviteDetails }) {
  const now = new Date();
  const expiresAt = new Date(invite.expiresAt);

  if (invite.usedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Used
      </span>
    );
  }
  if (invite.revokedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Revoked
      </span>
    );
  }
  if (expiresAt < now) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warm-gray-100 text-warm-gray-600">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      Active
    </span>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [allInvites, setAllInvites] = useState<InviteDetails[]>([]);
  const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);
  const [statusChangedByUser, setStatusChangedByUser] = useState<StatusChangedByUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vercel Project ID editing state
  const [vercelProjectId, setVercelProjectId] = useState("");
  const [savingVercelProjectId, setSavingVercelProjectId] = useState(false);
  const [vercelProjectIdError, setVercelProjectIdError] = useState<string | null>(null);
  const [vercelProjectIdSuccess, setVercelProjectIdSuccess] = useState(false);

  // Site toggle state
  const [togglingSite, setTogglingSite] = useState(false);
  const [siteToggleError, setSiteToggleError] = useState<string | null>(null);

  // GitHub repository selector state
  const [adminGitHubStatus, setAdminGitHubStatus] = useState<AdminGitHubStatus | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [savingRepo, setSavingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [repoSuccess, setRepoSuccess] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user details");
          }
          return;
        }
        const data = await response.json();
        setUser(data.user);
        setAllInvites(data.allInvites || []);
        setWaitlistEntry(data.waitlistEntry);
        setStatusChangedByUser(data.statusChangedByUser);
        setVercelProjectId(data.user.vercelProjectId || "");
      } catch {
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  // Fetch admin's GitHub connection status
  useEffect(() => {
    async function fetchAdminGitHubStatus() {
      try {
        const response = await fetch("/api/admin/github/status");
        if (response.ok) {
          const data = await response.json();
          setAdminGitHubStatus({
            connected: data.connected,
            username: data.username,
          });
        }
      } catch {
        // Silently fail - GitHub features just won't be available
      }
    }

    fetchAdminGitHubStatus();
  }, []);

  // Fetch repositories when dropdown opens
  const fetchRepos = async (search = "") => {
    if (!adminGitHubStatus?.connected) return;

    setLoadingRepos(true);
    setRepoError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("per_page", "50");

      const response = await fetch(`/api/admin/github/repos?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data.repos);
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : "Failed to fetch repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!repoDropdownOpen) return;

    const timer = setTimeout(() => {
      fetchRepos(repoSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [repoSearch, repoDropdownOpen, adminGitHubStatus?.connected]);

  // Save GitHub repo selection
  const handleSaveRepo = async (repo: GitHubRepo | null) => {
    setSavingRepo(true);
    setRepoError(null);
    setRepoSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubRepoFullName: repo?.full_name || null,
          githubRepoId: repo?.id?.toString() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await response.json();
      setUser((prev) =>
        prev
          ? {
              ...prev,
              githubRepoFullName: data.user.githubRepoFullName,
              githubRepoId: data.user.githubRepoId,
            }
          : prev
      );
      setRepoDropdownOpen(false);
      setRepoSearch("");
      setRepoSuccess(true);
      setTimeout(() => setRepoSuccess(false), 3000);
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingRepo(false);
    }
  };

  // Build timeline events sorted by date (newest first)
  const timelineEvents = useMemo(() => {
    if (!user) return [];

    const events: TimelineEvent[] = [];

    // Account created
    events.push({
      id: "account_created",
      type: "account_created",
      date: new Date(user.createdAt),
      data: {},
    });

    // Waitlist joined
    if (waitlistEntry) {
      events.push({
        id: "waitlist_joined",
        type: "waitlist_joined",
        date: new Date(waitlistEntry.createdAt),
        data: { waitlistEntry },
      });

      // Waitlist invited
      if (waitlistEntry.invitedAt) {
        events.push({
          id: "waitlist_invited",
          type: "waitlist_invited",
          date: new Date(waitlistEntry.invitedAt),
          data: { waitlistEntry },
        });
      }
    }

    // All invites
    allInvites.forEach((invite) => {
      // Invite sent
      events.push({
        id: `invite_sent_${invite.id}`,
        type: "invite_sent",
        date: new Date(invite.createdAt),
        data: { invite },
      });

      // Invite used (only for the invite used by this user)
      if (invite.usedAt && invite.isUsedByThisUser) {
        events.push({
          id: `invite_used_${invite.id}`,
          type: "invite_used",
          date: new Date(invite.usedAt),
          data: { invite },
        });
      }

      // Invite revoked
      if (invite.revokedAt) {
        events.push({
          id: `invite_revoked_${invite.id}`,
          type: "invite_revoked",
          date: new Date(invite.revokedAt),
          data: { invite },
        });
      }
    });

    // Status changed
    if (user.statusChangedAt && user.status !== "active") {
      events.push({
        id: "status_changed",
        type: "status_changed",
        date: new Date(user.statusChangedAt),
        data: { status: user.status, changedBy: statusChangedByUser },
      });
    }

    // Sort by date (newest first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [user, allInvites, waitlistEntry, statusChangedByUser]);

  const usedInvite = allInvites.find((i) => i.isUsedByThisUser);

  // Save Vercel Project ID
  const handleSaveVercelProjectId = async () => {
    setSavingVercelProjectId(true);
    setVercelProjectIdError(null);
    setVercelProjectIdSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vercelProjectId: vercelProjectId || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await response.json();
      setUser((prev) =>
        prev ? { ...prev, vercelProjectId: data.user.vercelProjectId } : prev
      );
      setVercelProjectIdSuccess(true);
      setTimeout(() => setVercelProjectIdSuccess(false), 3000);
    } catch (err) {
      setVercelProjectIdError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingVercelProjectId(false);
    }
  };

  // Toggle site enabled/disabled
  const handleToggleSite = async () => {
    if (!user) return;

    setTogglingSite(true);
    setSiteToggleError(null);

    try {
      const response = await fetch(`/api/admin/creators/${userId}/site-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !user.siteEnabled }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to toggle site");
      }

      const data = await response.json();
      setUser((prev) =>
        prev ? { ...prev, siteEnabled: data.siteEnabled } : prev
      );
    } catch (err) {
      setSiteToggleError(err instanceof Error ? err.message : "Failed to toggle site");
    } finally {
      setTogglingSite(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-warm-gray-200 border-t-coral rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-gray-500">{error || "User not found"}</p>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 mt-4 text-coral hover:text-coral/80"
        >
          <ArrowLeft size={16} />
          Back to Admin Panel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/admin"
        className="inline-flex items-center gap-2 text-warm-gray-500 hover:text-warm-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Admin Panel
      </Link>

      {/* User Header */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-start gap-6">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-warm-gray-100 flex items-center justify-center">
              <User size={32} className="text-warm-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-warm-gray-900">
                {user.displayName || user.name}
              </h2>
              <StatusBadge status={user.status} />
            </div>
            {user.displayName && user.name !== user.displayName && (
              <p className="text-warm-gray-500 mt-1">{user.name}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-warm-gray-600">
              <span className="flex items-center gap-1.5">
                <Mail size={16} />
                {user.email}
              </span>
              {user.username && (
                <span className="text-warm-gray-400">@{user.username}</span>
              )}
            </div>
            {user.subdomain && (
              <a
                href={`https://${user.subdomain}.ugc.community`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-coral hover:text-coral/80"
              >
                <Globe size={16} />
                {user.subdomain}.ugc.community
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Social Links */}
        {(user.instagramHandle ||
          user.tiktokHandle ||
          user.youtubeHandle ||
          user.twitterHandle) && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-warm-gray-100">
            {user.instagramHandle && (
              <a
                href={`https://instagram.com/${user.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-warm-gray-600 hover:text-pink-600"
              >
                <Instagram size={18} />
                @{user.instagramHandle}
              </a>
            )}
            {user.tiktokHandle && (
              <a
                href={`https://tiktok.com/@${user.tiktokHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-warm-gray-600 hover:text-black"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-[18px] h-[18px] fill-current"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
                @{user.tiktokHandle}
              </a>
            )}
            {user.youtubeHandle && (
              <a
                href={`https://youtube.com/@${user.youtubeHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-warm-gray-600 hover:text-red-600"
              >
                <Youtube size={18} />
                @{user.youtubeHandle}
              </a>
            )}
            {user.twitterHandle && (
              <a
                href={`https://twitter.com/${user.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-warm-gray-600 hover:text-blue-500"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-[18px] h-[18px] fill-current"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{user.twitterHandle}
              </a>
            )}
          </div>
        )}

        {/* Bio */}
        {user.bio && (
          <div className="mt-4 pt-4 border-t border-warm-gray-100">
            <p className="text-warm-gray-600 whitespace-pre-wrap">{user.bio}</p>
          </div>
        )}
      </div>

      {/* Profile Stats & Site Preview */}
      {user.subdomain && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Stats */}
          <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
            <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">
              Profile Stats
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-lavender-soft/30 flex items-center justify-center">
                <Eye size={24} className="text-lavender" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warm-gray-900">
                  {user.profileViewCount.toLocaleString()}
                </p>
                <p className="text-sm text-warm-gray-500">Profile Views</p>
              </div>
            </div>
          </div>

          {/* Site Preview */}
          <div className="lg:col-span-2 bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-warm-gray-900">
                Site Preview
              </h3>
              <a
                href={`https://${user.subdomain}.ugc.community`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-coral hover:text-coral/80 flex items-center gap-1"
              >
                Open full site
                <ExternalLink size={14} />
              </a>
            </div>
            <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-warm-gray-200 bg-warm-gray-50">
              <iframe
                src={`https://${user.subdomain}.ugc.community`}
                title={`${user.displayName || user.name}'s site preview`}
                className="absolute inset-0 w-full h-full"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      {/* GitHub Repository */}
      {adminGitHubStatus?.connected && (
        <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Github size={20} className="text-warm-gray-600" />
            <h3 className="text-lg font-semibold text-warm-gray-900">
              GitHub Repository
            </h3>
          </div>

          <div className="space-y-4">
            {/* Current Selection */}
            {user.githubRepoFullName && !repoDropdownOpen && (
              <div className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-lg border border-warm-gray-200">
                <div className="flex items-center gap-3">
                  <Github size={18} className="text-warm-gray-600" />
                  <div>
                    <p className="font-medium text-warm-gray-900">
                      {user.githubRepoFullName}
                    </p>
                    <a
                      href={`https://github.com/${user.githubRepoFullName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-coral hover:text-coral/80 flex items-center gap-1"
                    >
                      View on GitHub
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleSaveRepo(null)}
                  disabled={savingRepo}
                  className="p-2 text-warm-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove repository"
                >
                  {savingRepo ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                </button>
              </div>
            )}

            {/* Repository Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                {user.githubRepoFullName ? "Change Repository" : "Select Repository"}
              </label>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-warm-gray-400" />
                </div>
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  onFocus={() => {
                    setRepoDropdownOpen(true);
                    if (repos.length === 0) fetchRepos();
                  }}
                  placeholder="Search repositories..."
                  className="w-full pl-10 pr-10 py-2 border border-warm-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                />
                <button
                  onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <ChevronDown
                    size={16}
                    className={`text-warm-gray-400 transition-transform ${
                      repoDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Dropdown */}
              {repoDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-warm-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {loadingRepos ? (
                    <div className="p-4 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-warm-gray-400" />
                      <span className="ml-2 text-sm text-warm-gray-500">
                        Loading repositories...
                      </span>
                    </div>
                  ) : repoError ? (
                    <div className="p-4 text-sm text-red-600">{repoError}</div>
                  ) : repos.length === 0 ? (
                    <div className="p-4 text-sm text-warm-gray-500">
                      {repoSearch
                        ? "No repositories found matching your search"
                        : "No repositories found"}
                    </div>
                  ) : (
                    <ul className="py-1">
                      {repos.map((repo) => (
                        <li key={repo.id}>
                          <button
                            onClick={() => handleSaveRepo(repo)}
                            disabled={savingRepo}
                            className="w-full px-4 py-2 text-left hover:bg-warm-gray-50 flex items-center justify-between gap-2 disabled:opacity-50"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Github size={16} className="text-warm-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-warm-gray-900 truncate">
                                {repo.full_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {repo.private ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  <Lock size={10} />
                                  Private
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <Unlock size={10} />
                                  Public
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Close dropdown when clicking outside */}
            {repoDropdownOpen && (
              <div
                className="fixed inset-0 z-0"
                onClick={() => {
                  setRepoDropdownOpen(false);
                  setRepoSearch("");
                }}
              />
            )}

            {repoSuccess && (
              <p className="text-sm text-green-600">Repository saved successfully!</p>
            )}
          </div>
        </div>
      )}

      {/* GitHub Not Connected Notice */}
      {adminGitHubStatus !== null && !adminGitHubStatus.connected && (
        <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Github size={20} className="text-warm-gray-400" />
            <h3 className="text-lg font-semibold text-warm-gray-500">
              GitHub Repository
            </h3>
          </div>
          <p className="text-sm text-warm-gray-500">
            Connect your GitHub account in{" "}
            <a
              href="/dashboard/admin"
              className="text-coral hover:text-coral/80 underline"
            >
              Admin Settings
            </a>{" "}
            to assign repositories to users.
          </p>
        </div>
      )}

      {/* Vercel Integration */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">
            Vercel Integration
          </h3>
        </div>

        <div className="space-y-6">
          {/* Vercel Project ID */}
          <div>
            <label
              htmlFor="vercelProjectId"
              className="block text-sm font-medium text-warm-gray-700 mb-1"
            >
              Vercel Project ID
            </label>
            <div className="flex gap-2">
              <input
                id="vercelProjectId"
                type="text"
                value={vercelProjectId}
                onChange={(e) => setVercelProjectId(e.target.value)}
                placeholder="prj_xxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2 border border-warm-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              />
              <button
                onClick={handleSaveVercelProjectId}
                disabled={savingVercelProjectId || vercelProjectId === (user.vercelProjectId || "")}
                className="px-4 py-2 bg-coral text-white rounded-lg text-sm font-medium hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingVercelProjectId ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
            <div className="flex items-start gap-1.5 mt-2">
              <HelpCircle size={14} className="text-warm-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-warm-gray-500">
                Find this in Vercel Dashboard → Project → Settings → General
              </p>
            </div>
            {vercelProjectIdError && (
              <p className="text-sm text-red-600 mt-2">{vercelProjectIdError}</p>
            )}
            {vercelProjectIdSuccess && (
              <p className="text-sm text-green-600 mt-2">Saved successfully!</p>
            )}
          </div>

          {/* Site Toggle */}
          {user.subdomain && (
            <div className="pt-4 border-t border-warm-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-warm-gray-900">
                    Subdomain Hosting
                  </p>
                  <p className="text-sm text-warm-gray-500 mt-0.5">
                    {user.siteEnabled
                      ? `Site is live at ${user.subdomain}.ugc.community`
                      : "Enable to publish site to subdomain"}
                  </p>
                </div>
                <button
                  onClick={handleToggleSite}
                  disabled={togglingSite || !user.vercelProjectId}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.siteEnabled
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {togglingSite ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {user.siteEnabled ? "Disabling..." : "Enabling..."}
                    </>
                  ) : user.siteEnabled ? (
                    <>
                      <PowerOff size={16} />
                      Disable Site
                    </>
                  ) : (
                    <>
                      <Power size={16} />
                      Enable Site
                    </>
                  )}
                </button>
              </div>
              {!user.vercelProjectId && (
                <p className="text-sm text-amber-600 mt-2">
                  Set a Vercel Project ID above to enable site hosting
                </p>
              )}
              {siteToggleError && (
                <p className="text-sm text-red-600 mt-2">{siteToggleError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <h3 className="text-lg font-semibold text-warm-gray-900 mb-6">
          User Journey
        </h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-warm-gray-200" />

          <div className="space-y-6">
            {timelineEvents.map((event) => (
              <TimelineItem
                key={event.id}
                event={event}
                user={user}
              />
            ))}

            {/* No invites - direct signup */}
            {allInvites.length === 0 && !waitlistEntry && (
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-warm-gray-100 flex items-center justify-center">
                  <User size={16} className="text-warm-gray-600" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-medium text-warm-gray-900">Direct Signup</p>
                  <p className="text-warm-gray-500 text-sm mt-0.5">
                    User signed up without an invite link or waitlist
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Invites Section */}
      {allInvites.length > 0 && (
        <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
          <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">
            Related Invites ({allInvites.length})
          </h3>
          <div className="space-y-3">
            {allInvites.map((invite) => (
              <div
                key={invite.id}
                className={`p-4 rounded-lg border ${
                  invite.isUsedByThisUser
                    ? "bg-green-50 border-green-200"
                    : "bg-warm-gray-50 border-warm-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <InviteStatusBadge invite={invite} />
                    {invite.isUsedByThisUser && (
                      <span className="text-xs text-green-600 font-medium">
                        Used to sign up
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-warm-gray-500">
                    {formatDate(invite.createdAt)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-warm-gray-600">
                  {invite.creator && (
                    <p>
                      Created by{" "}
                      <span className="font-medium">{invite.creator.name}</span>
                    </p>
                  )}
                  {invite.email && (
                    <p className="text-warm-gray-500">Sent to: {invite.email}</p>
                  )}
                  <p className="text-warm-gray-400">
                    Expires: {formatDate(invite.expiresAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waitlist Entry Section */}
      {waitlistEntry && (
        <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
          <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">
            Waitlist Entry
          </h3>
          <div className="p-4 rounded-lg bg-warm-gray-50 border border-warm-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  waitlistEntry.invitedAt
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {waitlistEntry.invitedAt ? "Invited" : "Pending"}
              </span>
              <span className="text-sm text-warm-gray-500">
                Joined {formatDate(waitlistEntry.createdAt)}
              </span>
            </div>
            {waitlistEntry.invitedAt && (
              <p className="text-sm text-warm-gray-600">
                Invited on {formatDate(waitlistEntry.invitedAt)}
                {waitlistEntry.invitedByUser && (
                  <span>
                    {" "}
                    by{" "}
                    <span className="font-medium">
                      {waitlistEntry.invitedByUser.name}
                    </span>
                  </span>
                )}
              </p>
            )}
            {/* Waitlist social handles */}
            {(waitlistEntry.instagramHandle ||
              waitlistEntry.tiktokHandle ||
              waitlistEntry.youtubeHandle ||
              waitlistEntry.twitterHandle) && (
              <div className="flex items-center gap-3 mt-2 text-warm-gray-500">
                {waitlistEntry.instagramHandle && (
                  <span className="flex items-center gap-1 text-sm">
                    <Instagram size={14} /> @{waitlistEntry.instagramHandle}
                  </span>
                )}
                {waitlistEntry.tiktokHandle && (
                  <span className="text-sm">TikTok: @{waitlistEntry.tiktokHandle}</span>
                )}
                {waitlistEntry.youtubeHandle && (
                  <span className="flex items-center gap-1 text-sm">
                    <Youtube size={14} /> @{waitlistEntry.youtubeHandle}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Details */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">
          Account Details
        </h3>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-warm-gray-500">User ID</dt>
            <dd className="text-sm font-mono text-warm-gray-900 mt-0.5">
              {user.id}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-warm-gray-500">Email Verified</dt>
            <dd className="text-sm text-warm-gray-900 mt-0.5">
              {user.emailVerified ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} /> Yes
                </span>
              ) : (
                <span className="text-warm-gray-500">No</span>
              )}
            </dd>
          </div>
          {user.websiteUrl && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-warm-gray-500">Website</dt>
              <dd className="text-sm mt-0.5">
                <a
                  href={user.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral hover:text-coral/80 flex items-center gap-1"
                >
                  {user.websiteUrl}
                  <ExternalLink size={14} />
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function TimelineItem({
  event,
  user,
}: {
  event: TimelineEvent;
  user: UserDetails;
}) {
  const config: Record<
    TimelineEvent["type"],
    {
      icon: typeof CheckCircle;
      bgColor: string;
      iconColor: string;
      title: string;
    }
  > = {
    account_created: {
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      title: "Account Created",
    },
    waitlist_joined: {
      icon: Users,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      title: "Joined Waitlist",
    },
    waitlist_invited: {
      icon: Send,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      title: "Invited from Waitlist",
    },
    invite_sent: {
      icon: Mail,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "Invite Created",
    },
    invite_used: {
      icon: UserPlus,
      bgColor: "bg-coral/10",
      iconColor: "text-coral",
      title: "Used Invite to Sign Up",
    },
    invite_expired: {
      icon: Clock,
      bgColor: "bg-warm-gray-100",
      iconColor: "text-warm-gray-600",
      title: "Invite Expired",
    },
    invite_revoked: {
      icon: XCircle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      title: "Invite Revoked",
    },
    status_changed: {
      icon: user.status === "suspended" ? ShieldOff : Ban,
      bgColor: user.status === "suspended" ? "bg-amber-100" : "bg-red-100",
      iconColor:
        user.status === "suspended" ? "text-amber-600" : "text-red-600",
      title: `Status Changed to ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}`,
    },
    last_updated: {
      icon: Clock,
      bgColor: "bg-warm-gray-100",
      iconColor: "text-warm-gray-600",
      title: "Last Updated",
    },
  };

  const { icon: Icon, bgColor, iconColor, title } = config[event.type];
  const invite = event.data.invite as InviteDetails | undefined;
  const waitlistEntryData = event.data.waitlistEntry as WaitlistEntry | undefined;
  const changedBy = event.data.changedBy as StatusChangedByUser | undefined;

  return (
    <div className="relative flex items-start gap-4">
      <div
        className={`relative z-10 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}
      >
        <Icon size={16} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-medium text-warm-gray-900">{title}</p>
        <p className="text-warm-gray-500 text-sm mt-0.5">
          {formatDate(event.date.toISOString())}
        </p>
        <p className="text-warm-gray-400 text-xs mt-0.5">
          {formatRelativeTime(event.date.toISOString())}
        </p>

        {/* Additional context based on event type */}
        {event.type === "invite_sent" && invite?.creator && (
          <p className="text-warm-gray-500 text-sm mt-2">
            Created by{" "}
            <span className="font-medium">{invite.creator.name}</span>
            <span className="text-warm-gray-400">
              {" "}
              ({invite.creator.email})
            </span>
          </p>
        )}

        {event.type === "waitlist_invited" && waitlistEntryData?.invitedByUser && (
          <p className="text-warm-gray-500 text-sm mt-2">
            Invited by{" "}
            <span className="font-medium">
              {waitlistEntryData.invitedByUser.name}
            </span>
          </p>
        )}

        {event.type === "status_changed" && changedBy && (
          <p className="text-warm-gray-500 text-sm mt-2">
            Changed by <span className="font-medium">{changedBy.name}</span>
            <span className="text-warm-gray-400"> ({changedBy.email})</span>
          </p>
        )}
      </div>
    </div>
  );
}
