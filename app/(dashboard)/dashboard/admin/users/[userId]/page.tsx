"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
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
  createdAt: string;
  updatedAt: string;
}

interface InviteDetails {
  id: string;
  email: string | null;
  createdAt: string;
  usedAt: string | null;
  createdBy: string;
  creator: {
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

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      <Icon size={14} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [statusChangedByUser, setStatusChangedByUser] = useState<StatusChangedByUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setInvite(data.invite);
        setStatusChangedByUser(data.statusChangedByUser);
      } catch {
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

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
        {(user.instagramHandle || user.tiktokHandle || user.youtubeHandle || user.twitterHandle) && (
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
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
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
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
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

      {/* Timeline */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <h3 className="text-lg font-semibold text-warm-gray-900 mb-6">User History</h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-warm-gray-200" />

          <div className="space-y-6">
            {/* Signed Up */}
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-medium text-warm-gray-900">Account Created</p>
                <p className="text-warm-gray-500 text-sm mt-0.5">
                  {formatDate(user.createdAt)}
                </p>
                <p className="text-warm-gray-400 text-xs mt-0.5">
                  {formatRelativeTime(user.createdAt)}
                </p>
              </div>
            </div>

            {/* Invite Accepted (if applicable) */}
            {invite?.usedAt && (
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center">
                  <UserPlus size={16} className="text-coral" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-medium text-warm-gray-900">Accepted Invite</p>
                  <p className="text-warm-gray-500 text-sm mt-0.5">
                    {formatDate(invite.usedAt)}
                  </p>
                  <p className="text-warm-gray-400 text-xs mt-0.5">
                    {formatRelativeTime(invite.usedAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Invite Created (if applicable) */}
            {invite && (
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-medium text-warm-gray-900">Invite Sent</p>
                  <p className="text-warm-gray-500 text-sm mt-0.5">
                    {formatDate(invite.createdAt)}
                  </p>
                  <p className="text-warm-gray-400 text-xs mt-0.5">
                    {formatRelativeTime(invite.createdAt)}
                  </p>
                  {invite.creator && (
                    <p className="text-warm-gray-500 text-sm mt-2">
                      Invited by <span className="font-medium">{invite.creator.name}</span>
                      <span className="text-warm-gray-400"> ({invite.creator.email})</span>
                    </p>
                  )}
                  {invite.email && (
                    <p className="text-warm-gray-400 text-sm">
                      Sent to: {invite.email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* No invite - direct signup */}
            {!invite && (
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-warm-gray-100 flex items-center justify-center">
                  <User size={16} className="text-warm-gray-600" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-medium text-warm-gray-900">Direct Signup</p>
                  <p className="text-warm-gray-500 text-sm mt-0.5">
                    User signed up without an invite link
                  </p>
                </div>
              </div>
            )}

            {/* Status Change (if applicable) */}
            {user.statusChangedAt && user.status !== "active" && (
              <div className="relative flex items-start gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  user.status === "suspended" ? "bg-amber-100" : "bg-red-100"
                }`}>
                  {user.status === "suspended" ? (
                    <ShieldOff size={16} className="text-amber-600" />
                  ) : (
                    <Ban size={16} className="text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-medium text-warm-gray-900">
                    Status Changed to {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </p>
                  <p className="text-warm-gray-500 text-sm mt-0.5">
                    {formatDate(user.statusChangedAt)}
                  </p>
                  <p className="text-warm-gray-400 text-xs mt-0.5">
                    {formatRelativeTime(user.statusChangedAt)}
                  </p>
                  {statusChangedByUser && (
                    <p className="text-warm-gray-500 text-sm mt-2">
                      Changed by <span className="font-medium">{statusChangedByUser.name}</span>
                      <span className="text-warm-gray-400"> ({statusChangedByUser.email})</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {user.updatedAt !== user.createdAt && (
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-warm-gray-100 flex items-center justify-center">
                  <Clock size={16} className="text-warm-gray-600" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-medium text-warm-gray-900">Last Updated</p>
                  <p className="text-warm-gray-500 text-sm mt-0.5">
                    {formatDate(user.updatedAt)}
                  </p>
                  <p className="text-warm-gray-400 text-xs mt-0.5">
                    {formatRelativeTime(user.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <h3 className="text-lg font-semibold text-warm-gray-900 mb-4">Account Details</h3>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-warm-gray-500">User ID</dt>
            <dd className="text-sm font-mono text-warm-gray-900 mt-0.5">{user.id}</dd>
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
