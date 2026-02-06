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
  Briefcase,
  Power,
  PowerOff,
  Loader2,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { UserProgressionPath } from "@/components/milestones/UserProgressionPath";
import { PortfolioUploadDropzone } from "@/components/admin/PortfolioUploadDropzone";

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
  instagramHandles: string[] | null;
  tiktokHandles: string[] | null;
  youtubeHandles: string[] | null;
  twitterHandles: string[] | null;
  subdomain: string | null;
  status: string;
  role: string;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  profileViewCount: number;
  portfolioViewCount: number;
  contactSubmissionCount: number;
  contactSubmissionCountLast30Days: number;
  contactSubmissionCountLast7Days: number;
  siteEnabled: boolean;
  createdAt: string;
  updatedAt: string;
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

  // Subdomain editing state
  const [subdomainInput, setSubdomainInput] = useState("");
  const [savingSubdomain, setSavingSubdomain] = useState(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [subdomainSuccess, setSubdomainSuccess] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>([]);

  // Site toggle state
  const [togglingSite, setTogglingSite] = useState(false);
  const [siteToggleError, setSiteToggleError] = useState<string | null>(null);
  const [siteToggleSuccess, setSiteToggleSuccess] = useState(false);

  // Social handles editing state - now arrays with max 5 per platform
  const [instagramHandles, setInstagramHandles] = useState<string[]>([]);
  const [tiktokHandles, setTiktokHandles] = useState<string[]>([]);
  const [youtubeHandles, setYoutubeHandles] = useState<string[]>([]);
  const [twitterHandles, setTwitterHandles] = useState<string[]>([]);
  const [savingSocialHandles, setSavingSocialHandles] = useState(false);
  const [socialHandlesError, setSocialHandlesError] = useState<string | null>(null);
  const [socialHandlesSuccess, setSocialHandlesSuccess] = useState(false);
  const MAX_HANDLES_PER_PLATFORM = 5;

  // Bio editing state
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioSuccess, setBioSuccess] = useState(false);

  // Role editing state
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState(false);

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
        setSubdomainInput(data.user.subdomain || "");
        setInstagramHandles(data.user.instagramHandles || []);
        setTiktokHandles(data.user.tiktokHandles || []);
        setYoutubeHandles(data.user.youtubeHandles || []);
        setTwitterHandles(data.user.twitterHandles || []);
        setBioInput(data.user.bio || "");
      } catch {
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  // Debounced subdomain availability check
  // Debounced subdomain availability check
  useEffect(() => {
    if (!subdomainInput || subdomainInput === user?.subdomain) {
      setSubdomainAvailable(null);
      setSubdomainSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSubdomain(true);
      setSubdomainError(null);

      try {
        const response = await fetch(`/api/user/subdomain?check=${encodeURIComponent(subdomainInput)}`);
        const data = await response.json();
        setSubdomainAvailable(data.available);
        setSubdomainSuggestions(data.suggestions || []);
        if (!data.available && data.reason) {
          setSubdomainError(data.reason);
        }
      } catch {
        setSubdomainError("Failed to check availability");
      } finally {
        setCheckingSubdomain(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomainInput, user?.subdomain]);

  // Save subdomain
  const handleSaveSubdomain = async () => {
    setSavingSubdomain(true);
    setSubdomainError(null);
    setSubdomainSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: subdomainInput.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save subdomain");
      }

      const data = await response.json();
      setUser((prev) =>
        prev ? { ...prev, subdomain: data.user.subdomain } : prev
      );
      setSubdomainInput(data.user.subdomain || "");
      setSubdomainAvailable(null);
      setSubdomainSuggestions([]);
      setSubdomainSuccess(true);
      setTimeout(() => setSubdomainSuccess(false), 3000);
    } catch (err) {
      setSubdomainError(err instanceof Error ? err.message : "Failed to save subdomain");
    } finally {
      setSavingSubdomain(false);
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

  // Toggle site enabled/disabled
  const handleToggleSite = async () => {
    if (!user) return;

    setTogglingSite(true);
    setSiteToggleError(null);
    setSiteToggleSuccess(false);

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
      setSiteToggleSuccess(true);
      setTimeout(() => setSiteToggleSuccess(false), 3000);
    } catch (err) {
      setSiteToggleError(err instanceof Error ? err.message : "Failed to toggle site");
    } finally {
      setTogglingSite(false);
    }
  };

  // Save social handles
  const handleSaveSocialHandles = async () => {
    setSavingSocialHandles(true);
    setSocialHandlesError(null);
    setSocialHandlesSuccess(false);

    try {
      // Filter out empty handles before sending
      const cleanHandles = (handles: string[]) =>
        handles.map(h => h.trim().replace(/^@/, '')).filter(h => h.length > 0);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramHandles: cleanHandles(instagramHandles),
          tiktokHandles: cleanHandles(tiktokHandles),
          youtubeHandles: cleanHandles(youtubeHandles),
          twitterHandles: cleanHandles(twitterHandles),
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
              instagramHandles: data.user.instagramHandles,
              tiktokHandles: data.user.tiktokHandles,
              youtubeHandles: data.user.youtubeHandles,
              twitterHandles: data.user.twitterHandles,
            }
          : prev
      );
      // Update local state with saved values
      setInstagramHandles(data.user.instagramHandles || []);
      setTiktokHandles(data.user.tiktokHandles || []);
      setYoutubeHandles(data.user.youtubeHandles || []);
      setTwitterHandles(data.user.twitterHandles || []);
      setSocialHandlesSuccess(true);
      setTimeout(() => setSocialHandlesSuccess(false), 3000);
    } catch (err) {
      setSocialHandlesError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingSocialHandles(false);
    }
  };

  // Helper to compare arrays
  const arraysEqual = (a: string[], b: string[] | null | undefined) => {
    const bArr = b ?? [];
    if (a.length !== bArr.length) return false;
    return a.every((val, idx) => val === bArr[idx]);
  };

  // Check if social handles have changed
  const socialHandlesChanged =
    !arraysEqual(instagramHandles, user?.instagramHandles) ||
    !arraysEqual(tiktokHandles, user?.tiktokHandles) ||
    !arraysEqual(youtubeHandles, user?.youtubeHandles) ||
    !arraysEqual(twitterHandles, user?.twitterHandles);

  // Save bio
  const handleSaveBio = async () => {
    setSavingBio(true);
    setBioError(null);
    setBioSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bioInput.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save bio");
      }

      const data = await response.json();
      setUser((prev) =>
        prev
          ? {
              ...prev,
              bio: data.user.bio,
            }
          : prev
      );
      setBioSuccess(true);
      setTimeout(() => setBioSuccess(false), 3000);
    } catch (err) {
      setBioError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingBio(false);
    }
  };

  // Check if bio has changed
  const bioChanged = bioInput !== (user?.bio || "");

  // Update user role
  const handleUpdateRole = async (newRole: "creator" | "brand") => {
    if (!user || user.role === newRole) return;

    setSavingRole(true);
    setRoleError(null);
    setRoleSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      const data = await response.json();
      setUser((prev) =>
        prev ? { ...prev, role: data.user.role } : prev
      );
      setRoleSuccess(true);
      setTimeout(() => setRoleSuccess(false), 3000);
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingRole(false);
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
        {((user.instagramHandles && user.instagramHandles.length > 0) ||
          (user.tiktokHandles && user.tiktokHandles.length > 0) ||
          (user.youtubeHandles && user.youtubeHandles.length > 0) ||
          (user.twitterHandles && user.twitterHandles.length > 0)) && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-warm-gray-100">
            {user.instagramHandles?.map((handle, idx) => (
              <a
                key={`ig-${idx}`}
                href={`https://instagram.com/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-warm-gray-600 hover:text-pink-600"
              >
                <Instagram size={18} />
                @{handle}
              </a>
            ))}
            {user.tiktokHandles?.map((handle, idx) => (
              <a
                key={`tt-${idx}`}
                href={`https://tiktok.com/@${handle}`}
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
                @{handle}
              </a>
            ))}
            {user.youtubeHandles?.map((handle, idx) => (
              <a
                key={`yt-${idx}`}
                href={`https://youtube.com/@${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-warm-gray-600 hover:text-red-600"
              >
                <Youtube size={18} />
                @{handle}
              </a>
            ))}
            {user.twitterHandles?.map((handle, idx) => (
              <a
                key={`tw-${idx}`}
                href={`https://twitter.com/${handle}`}
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
                @{handle}
              </a>
            ))}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Stats */}
          <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
            <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">
              Profile Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
                  <Eye size={24} className="text-coral" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warm-gray-900">
                    {user.profileViewCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-warm-gray-500">Profile Views</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-warm-gray-100">
                <div className="w-12 h-12 rounded-full bg-warm-gray-100 flex items-center justify-center">
                  <Briefcase size={24} className="text-warm-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warm-gray-900">
                    {(user.portfolioViewCount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-warm-gray-500">Portfolio Views</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Stats */}
          <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
            <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">
              Contact Inquiries
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center">
                  <Mail size={24} className="text-coral" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warm-gray-900">
                    {user.contactSubmissionCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-warm-gray-500">Total Inquiries</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-warm-gray-100">
                <div>
                  <p className="text-lg font-semibold text-warm-gray-900">
                    {user.contactSubmissionCountLast30Days}
                  </p>
                  <p className="text-xs text-warm-gray-500">Last 30 days</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-warm-gray-900">
                    {user.contactSubmissionCountLast7Days}
                  </p>
                  <p className="text-xs text-warm-gray-500">Last 7 days</p>
                </div>
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

      {/* Portfolio Upload */}
      <PortfolioUploadDropzone
        userId={userId}
        subdomain={user.subdomain}
        siteEnabled={user.siteEnabled}
        onUploadComplete={() => {
          // Refresh user data to reflect siteEnabled change
          setUser((prev) =>
            prev ? { ...prev, siteEnabled: true } : prev
          );
        }}
      />

      {/* Milestone Progress */}
      <UserProgressionPath userId={userId} />

      {/* User Role Management */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">
            User Role
          </h3>
        </div>

        <p className="text-sm text-warm-gray-500 mb-4">
          Creators have access to milestones, portfolio, and media features. Brands have limited dashboard access.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleUpdateRole("creator")}
            disabled={savingRole || user.role === "creator"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              user.role === "creator"
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
            }`}
          >
            {savingRole && user.role !== "creator" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <User size={16} />
            )}
            Creator
          </button>

          <button
            onClick={() => handleUpdateRole("brand")}
            disabled={savingRole || user.role === "brand"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              user.role === "brand"
                ? "bg-warm-gray-100 text-warm-gray-700 cursor-default"
                : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
            }`}
          >
            {savingRole && user.role !== "brand" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Briefcase size={16} />
            )}
            Brand
          </button>
        </div>

        {roleError && (
          <p className="text-sm text-red-600 mt-3">{roleError}</p>
        )}
        {roleSuccess && (
          <p className="text-sm text-green-600 mt-3">Role updated successfully!</p>
        )}
      </div>

      {/* Subdomain Management */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">
            Subdomain
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="subdomain"
              className="block text-sm font-medium text-warm-gray-700 mb-1"
            >
              Custom Subdomain
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="subdomain"
                  type="text"
                  value={subdomainInput}
                  onChange={(e) => {
                    setSubdomainInput(e.target.value.toLowerCase().trim());
                    setSubdomainError(null);
                  }}
                  placeholder="username"
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 ${
                    subdomainAvailable === true
                      ? "border-green-300 focus:ring-green-500/20 focus:border-green-500"
                      : subdomainAvailable === false
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                      : "border-warm-gray-300 focus:ring-coral/20 focus:border-coral"
                  }`}
                  disabled={savingSubdomain}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingSubdomain && (
                    <Loader2 size={16} className="animate-spin text-warm-gray-400" />
                  )}
                  {!checkingSubdomain && subdomainAvailable === true && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                  {!checkingSubdomain && subdomainAvailable === false && (
                    <XCircle size={16} className="text-red-500" />
                  )}
                </div>
              </div>
              <span className="text-warm-gray-500 text-sm font-medium">.ugc.community</span>
            </div>
            <p className="text-xs text-warm-gray-500 mt-1">
              3-63 characters, lowercase letters, numbers, and hyphens only. Leave empty to remove.
            </p>
          </div>

          {/* Availability message */}
          {subdomainInput && subdomainInput !== user?.subdomain && !checkingSubdomain && (
            <p className={`text-sm ${subdomainAvailable ? "text-green-600" : "text-red-600"}`}>
              {subdomainAvailable
                ? "This subdomain is available!"
                : subdomainError || "This subdomain is not available"}
            </p>
          )}

          {/* Suggestions */}
          {subdomainSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-warm-gray-600">
                Try one of these available alternatives:
              </p>
              <div className="flex flex-wrap gap-2">
                {subdomainSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSubdomainInput(suggestion);
                      setSubdomainAvailable(null);
                      setSubdomainSuggestions([]);
                      setSubdomainError(null);
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-coral/10 text-coral hover:bg-coral/20 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* URL Preview */}
          {subdomainInput && (
            <div className="p-3 bg-warm-gray-50 rounded-lg border border-warm-gray-200">
              <p className="text-xs text-warm-gray-500 mb-1">Profile URL:</p>
              <p className="text-sm font-medium text-warm-gray-900 flex items-center gap-2">
                https://{subdomainInput}.ugc.community
                {user?.subdomain === subdomainInput && (
                  <a
                    href={`https://${subdomainInput}.ugc.community`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-coral hover:text-coral/80"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSaveSubdomain}
              disabled={
                savingSubdomain ||
                checkingSubdomain ||
                (subdomainInput !== "" && subdomainInput !== user?.subdomain && subdomainAvailable !== true)
              }
              className="px-4 py-2 bg-warm-gray-800 text-white rounded-lg text-sm font-medium hover:bg-warm-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingSubdomain ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Subdomain"
              )}
            </button>

            {user?.subdomain && (
              <button
                onClick={() => {
                  setSubdomainInput("");
                  setSubdomainAvailable(null);
                  setSubdomainSuggestions([]);
                }}
                disabled={savingSubdomain || subdomainInput === ""}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Subdomain
              </button>
            )}
          </div>

          {subdomainError && !checkingSubdomain && subdomainInput === user?.subdomain && (
            <p className="text-sm text-red-600">{subdomainError}</p>
          )}
          {subdomainSuccess && (
            <p className="text-sm text-green-600">Subdomain saved successfully!</p>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">Bio</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-warm-gray-700 mb-1"
            >
              User Bio
            </label>
            <textarea
              id="bio"
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Enter user bio..."
              rows={4}
              className="w-full px-3 py-2 border border-warm-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral resize-none"
              disabled={savingBio}
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSaveBio}
              disabled={savingBio || !bioChanged}
              className="px-4 py-2 bg-warm-gray-800 text-white rounded-lg text-sm font-medium hover:bg-warm-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingBio ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Bio"
              )}
            </button>
          </div>

          {bioError && <p className="text-sm text-red-600">{bioError}</p>}
          {bioSuccess && (
            <p className="text-sm text-green-600">Bio saved successfully!</p>
          )}
        </div>
      </div>

      {/* Social Media Handles */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Instagram size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">
            Social Media Handles
          </h3>
          <span className="text-xs text-warm-gray-400 ml-auto">Up to 5 per platform</span>
        </div>

        <div className="space-y-6">
          {/* Instagram */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-warm-gray-700">
                Instagram
              </label>
              <span className="text-xs text-warm-gray-400">
                {instagramHandles.length}/{MAX_HANDLES_PER_PLATFORM}
              </span>
            </div>
            <div className="space-y-2">
              {instagramHandles.map((handle, idx) => (
                <div key={`ig-input-${idx}`} className="flex items-center gap-2">
                  <span className="text-warm-gray-500 text-sm">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      const newHandles = [...instagramHandles];
                      newHandles[idx] = e.target.value.replace(/^@/, "");
                      setInstagramHandles(newHandles);
                    }}
                    placeholder="username"
                    className="flex-1 px-3 py-2 border border-warm-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                    disabled={savingSocialHandles}
                  />
                  <button
                    type="button"
                    onClick={() => setInstagramHandles(instagramHandles.filter((_, i) => i !== idx))}
                    className="p-2 text-warm-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={savingSocialHandles}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {instagramHandles.length < MAX_HANDLES_PER_PLATFORM && (
                <button
                  type="button"
                  onClick={() => setInstagramHandles([...instagramHandles, ""])}
                  className="flex items-center gap-1 text-sm text-coral hover:text-coral/80 transition-colors"
                  disabled={savingSocialHandles}
                >
                  <Plus size={14} />
                  Add Instagram handle
                </button>
              )}
            </div>
          </div>

          {/* TikTok */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-warm-gray-700">
                TikTok
              </label>
              <span className="text-xs text-warm-gray-400">
                {tiktokHandles.length}/{MAX_HANDLES_PER_PLATFORM}
              </span>
            </div>
            <div className="space-y-2">
              {tiktokHandles.map((handle, idx) => (
                <div key={`tt-input-${idx}`} className="flex items-center gap-2">
                  <span className="text-warm-gray-500 text-sm">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      const newHandles = [...tiktokHandles];
                      newHandles[idx] = e.target.value.replace(/^@/, "");
                      setTiktokHandles(newHandles);
                    }}
                    placeholder="username"
                    className="flex-1 px-3 py-2 border border-warm-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                    disabled={savingSocialHandles}
                  />
                  <button
                    type="button"
                    onClick={() => setTiktokHandles(tiktokHandles.filter((_, i) => i !== idx))}
                    className="p-2 text-warm-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={savingSocialHandles}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {tiktokHandles.length < MAX_HANDLES_PER_PLATFORM && (
                <button
                  type="button"
                  onClick={() => setTiktokHandles([...tiktokHandles, ""])}
                  className="flex items-center gap-1 text-sm text-coral hover:text-coral/80 transition-colors"
                  disabled={savingSocialHandles}
                >
                  <Plus size={14} />
                  Add TikTok handle
                </button>
              )}
            </div>
          </div>

          {/* YouTube */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-warm-gray-700">
                YouTube
              </label>
              <span className="text-xs text-warm-gray-400">
                {youtubeHandles.length}/{MAX_HANDLES_PER_PLATFORM}
              </span>
            </div>
            <div className="space-y-2">
              {youtubeHandles.map((handle, idx) => (
                <div key={`yt-input-${idx}`} className="flex items-center gap-2">
                  <span className="text-warm-gray-500 text-sm">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      const newHandles = [...youtubeHandles];
                      newHandles[idx] = e.target.value.replace(/^@/, "");
                      setYoutubeHandles(newHandles);
                    }}
                    placeholder="username"
                    className="flex-1 px-3 py-2 border border-warm-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                    disabled={savingSocialHandles}
                  />
                  <button
                    type="button"
                    onClick={() => setYoutubeHandles(youtubeHandles.filter((_, i) => i !== idx))}
                    className="p-2 text-warm-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={savingSocialHandles}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {youtubeHandles.length < MAX_HANDLES_PER_PLATFORM && (
                <button
                  type="button"
                  onClick={() => setYoutubeHandles([...youtubeHandles, ""])}
                  className="flex items-center gap-1 text-sm text-coral hover:text-coral/80 transition-colors"
                  disabled={savingSocialHandles}
                >
                  <Plus size={14} />
                  Add YouTube handle
                </button>
              )}
            </div>
          </div>

          {/* Twitter/X */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-warm-gray-700">
                X (Twitter)
              </label>
              <span className="text-xs text-warm-gray-400">
                {twitterHandles.length}/{MAX_HANDLES_PER_PLATFORM}
              </span>
            </div>
            <div className="space-y-2">
              {twitterHandles.map((handle, idx) => (
                <div key={`tw-input-${idx}`} className="flex items-center gap-2">
                  <span className="text-warm-gray-500 text-sm">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      const newHandles = [...twitterHandles];
                      newHandles[idx] = e.target.value.replace(/^@/, "");
                      setTwitterHandles(newHandles);
                    }}
                    placeholder="username"
                    className="flex-1 px-3 py-2 border border-warm-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                    disabled={savingSocialHandles}
                  />
                  <button
                    type="button"
                    onClick={() => setTwitterHandles(twitterHandles.filter((_, i) => i !== idx))}
                    className="p-2 text-warm-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={savingSocialHandles}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {twitterHandles.length < MAX_HANDLES_PER_PLATFORM && (
                <button
                  type="button"
                  onClick={() => setTwitterHandles([...twitterHandles, ""])}
                  className="flex items-center gap-1 text-sm text-coral hover:text-coral/80 transition-colors"
                  disabled={savingSocialHandles}
                >
                  <Plus size={14} />
                  Add X handle
                </button>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSaveSocialHandles}
              disabled={savingSocialHandles || !socialHandlesChanged}
              className="px-4 py-2 bg-warm-gray-800 text-white rounded-lg text-sm font-medium hover:bg-warm-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingSocialHandles ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Social Handles"
              )}
            </button>
          </div>

          {socialHandlesError && (
            <p className="text-sm text-red-600">{socialHandlesError}</p>
          )}
          {socialHandlesSuccess && (
            <p className="text-sm text-green-600">Social handles saved successfully!</p>
          )}
        </div>
      </div>

      {/* Site Hosting Toggle */}
      {user.subdomain && (
        <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} className="text-warm-gray-600" />
            <h3 className="text-lg font-semibold text-warm-gray-900">
              Site Hosting
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              {/* Status Indicator */}
              <div
                className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${
                  user.siteEnabled ? "bg-green-500" : "bg-warm-gray-300"
                }`}
                title={user.siteEnabled ? "Site is live" : "Site is disabled"}
              />
              <div>
                <p className="font-medium text-warm-gray-900">
                  Subdomain Hosting
                </p>
                {user.siteEnabled ? (
                  <a
                    href={`https://${user.subdomain}.ugc.community`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-coral hover:text-coral/80 flex items-center gap-1 mt-0.5"
                  >
                    {user.subdomain}.ugc.community
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <p className="text-sm text-warm-gray-400 mt-0.5">
                    {user.subdomain}.ugc.community
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleToggleSite}
              disabled={togglingSite || !user.subdomain}
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
          {siteToggleError && (
            <p className="text-sm text-red-600 mt-2">{siteToggleError}</p>
          )}
          {siteToggleSuccess && (
            <p className="text-sm text-green-600 mt-2">
              Site {user.siteEnabled ? "enabled" : "disabled"} successfully!
            </p>
          )}
        </div>
      )}

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
      bgColor: "bg-warm-gray-100",
      iconColor: "text-warm-gray-600",
      title: "Joined Waitlist",
    },
    waitlist_invited: {
      icon: Send,
      bgColor: "bg-coral/10",
      iconColor: "text-coral",
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
