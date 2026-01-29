"use client";

import { useState, useEffect } from "react";
import { Search, Send, Check, Instagram, ExternalLink } from "lucide-react";

interface WaitlistEntry {
  id: string;
  email: string;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  facebookHandle: string | null;
  twitterHandle: string | null;
  createdAt: string;
  invitedAt: string | null;
  inviter: { id: string; name: string; email: string } | null;
}

type WaitlistFilter = "all" | "pending" | "invited";

export function WaitlistTable() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WaitlistFilter>("all");
  const [inviting, setInviting] = useState<string | null>(null);
  const [invitedId, setInvitedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  async function fetchWaitlist() {
    try {
      const res = await fetch("/api/admin/waitlist");
      if (!res.ok) throw new Error("Failed to fetch waitlist");
      const data = await res.json();
      setEntries(data.waitlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(entry: WaitlistEntry) {
    setInviting(entry.id);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: entry.email,
          expirationDays: 7,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invite");
      }

      // Mark as invited in the waitlist
      const markRes = await fetch(`/api/admin/waitlist/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markInvited: true }),
      });

      if (markRes.ok) {
        const data = await markRes.json();
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, invitedAt: data.entry.invitedAt, inviter: data.entry.inviter }
              : e
          )
        );
      }

      setInvitedId(entry.id);
      setTimeout(() => setInvitedId(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(null);
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      search === "" ||
      entry.email.toLowerCase().includes(search.toLowerCase()) ||
      entry.instagramHandle?.toLowerCase().includes(search.toLowerCase()) ||
      entry.tiktokHandle?.toLowerCase().includes(search.toLowerCase()) ||
      entry.youtubeHandle?.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "pending") return matchesSearch && !entry.invitedAt;
    if (filter === "invited") return matchesSearch && !!entry.invitedAt;
    return matchesSearch;
  });

  const pendingCount = entries.filter((e) => !e.invitedAt).length;

  if (loading) {
    return (
      <div className="text-center py-12 text-warm-gray-500">Loading waitlist...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">Error: {error}</div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-warm-gray-900">Waitlist</h2>
          <p className="text-sm text-warm-gray-500">
            {pendingCount} pending {pendingCount === 1 ? "signup" : "signups"} awaiting invite
          </p>
        </div>
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
              placeholder="Search by email or social handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as WaitlistFilter)}
            className="px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          >
            <option value="all">All signups</option>
            <option value="pending">Pending</option>
            <option value="invited">Invited</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-gray-50 border-b border-warm-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Socials
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Signed Up
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-warm-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-warm-gray-500">
                    No waitlist entries found
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-warm-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono text-warm-gray-900">
                        {entry.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {entry.instagramHandle && (
                          <a
                            href={`https://instagram.com/${entry.instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-warm-gray-400 hover:text-pink-500 transition-colors"
                            title={`@${entry.instagramHandle}`}
                          >
                            <Instagram size={16} />
                          </a>
                        )}
                        {entry.tiktokHandle && (
                          <a
                            href={`https://tiktok.com/@${entry.tiktokHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-warm-gray-400 hover:text-black transition-colors"
                            title={`@${entry.tiktokHandle}`}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                          </a>
                        )}
                        {entry.youtubeHandle && (
                          <a
                            href={`https://youtube.com/@${entry.youtubeHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-warm-gray-400 hover:text-red-500 transition-colors"
                            title={`@${entry.youtubeHandle}`}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </a>
                        )}
                        {entry.facebookHandle && (
                          <a
                            href={`https://facebook.com/${entry.facebookHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-warm-gray-400 hover:text-blue-600 transition-colors"
                            title={entry.facebookHandle}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>
                        )}
                        {entry.twitterHandle && (
                          <a
                            href={`https://twitter.com/${entry.twitterHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-warm-gray-400 hover:text-black transition-colors"
                            title={`@${entry.twitterHandle}`}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                        {!entry.instagramHandle &&
                          !entry.tiktokHandle &&
                          !entry.youtubeHandle &&
                          !entry.facebookHandle &&
                          !entry.twitterHandle && (
                            <span className="text-xs text-warm-gray-400">None</span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-warm-gray-600">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {entry.invitedAt ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Invited
                          </span>
                          {entry.inviter && (
                            <p className="text-xs text-warm-gray-500 mt-1">
                              by {entry.inviter.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!entry.invitedAt && (
                        <button
                          onClick={() => sendInvite(entry)}
                          disabled={inviting === entry.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors disabled:opacity-50"
                          style={{ backgroundColor: '#1A1614', color: '#FFFFFF' }}
                          title="Send invite"
                        >
                          {inviting === entry.id ? (
                            <span className="w-4 h-4 block border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : invitedId === entry.id ? (
                            <Check size={14} />
                          ) : (
                            <Send size={14} />
                          )}
                          Invite
                        </button>
                      )}
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
            Showing {filteredEntries.length} of {entries.length} signups
          </p>
        </div>
      </div>
    </>
  );
}
