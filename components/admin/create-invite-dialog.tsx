"use client";

import { useState } from "react";
import { X, Copy, Check, Mail, Sparkles, Building2, UserPlus } from "lucide-react";

interface CreateInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateInviteDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateInviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"creator" | "brand">("creator");
  const [expirationDays, setExpirationDays] = useState(7);
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Waitlist + social handles (auto-added when email provided)
  const [waitlistAdded, setWaitlistAdded] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [facebookHandle, setFacebookHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // When email is provided, add to waitlist first (replicates organic signup)
      if (email) {
        const waitlistRes = await fetch("/api/admin/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            userType: role,
            instagramHandle: instagramHandle || undefined,
            tiktokHandle: tiktokHandle || undefined,
            youtubeHandle: youtubeHandle || undefined,
            facebookHandle: facebookHandle || undefined,
            twitterHandle: twitterHandle || undefined,
          }),
        });

        if (!waitlistRes.ok) {
          const data = await waitlistRes.json();
          // If already in waitlist, that's fine - continue with invite
          if (data.error !== "Email already exists in waitlist") {
            throw new Error(data.error || "Failed to add to waitlist");
          }
        } else {
          setWaitlistAdded(true);
        }
      }

      // Create the invite
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          role,
          expirationDays,
          sendEmail: email ? sendEmail : false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invite");
      }

      const data = await res.json();
      setCreatedUrl(data.invite.url);
      setEmailSent(data.invite.emailSent);

      // Mark waitlist entry as invited
      if (email) {
        const waitlistListRes = await fetch("/api/admin/waitlist");
        if (waitlistListRes.ok) {
          const waitlistData = await waitlistListRes.json();
          const entry = waitlistData.waitlist?.find(
            (w: { email: string }) => w.email.toLowerCase() === email.toLowerCase()
          );
          if (entry) {
            await fetch(`/api/admin/waitlist/${entry.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ markInvited: true }),
            });
          }
        }
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setEmail("");
    setRole("creator");
    setExpirationDays(7);
    setSendEmail(true);
    setError(null);
    setCreatedUrl(null);
    setEmailSent(false);
    setCopied(false);
    setWaitlistAdded(false);
    setInstagramHandle("");
    setTiktokHandle("");
    setYoutubeHandle("");
    setFacebookHandle("");
    setTwitterHandle("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-warm-gray-900/50"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-[--radius-xl] shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
          <h2 className="text-lg font-semibold text-warm-gray-900">
            Create Invite
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {createdUrl ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-warm-gray-600">
              <Check size={16} className="text-green-600" />
              <span>Invite created successfully!</span>
            </div>
            {waitlistAdded && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <UserPlus size={16} />
                <span>Added to waitlist</span>
              </div>
            )}
            {emailSent && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Mail size={16} />
                <span>Invitation email sent</span>
              </div>
            )}
            <p className="text-sm text-warm-gray-600">Share this link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={createdUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm font-mono bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md]"
              />
              <button
                onClick={handleCopy}
                className="p-2 text-warm-gray-600 hover:text-warm-gray-900 border border-warm-gray-200 rounded-[--radius-md] transition-colors"
              >
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2 text-sm font-medium text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-[--radius-md] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-warm-gray-700 mb-2">
                Role
              </label>
              <div className="flex rounded-[--radius-md] bg-warm-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setRole("creator")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[--radius-sm] text-sm font-medium transition-all ${
                    role === "creator"
                      ? "bg-white text-warm-gray-900 shadow-sm"
                      : "text-warm-gray-500 hover:text-warm-gray-700"
                  }`}
                >
                  <Sparkles size={14} />
                  Creator
                </button>
                <button
                  type="button"
                  onClick={() => setRole("brand")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[--radius-sm] text-sm font-medium transition-all ${
                    role === "brand"
                      ? "bg-white text-warm-gray-900 shadow-sm"
                      : "text-warm-gray-500 hover:text-warm-gray-700"
                  }`}
                >
                  <Building2 size={14} />
                  Brand
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-warm-gray-700 mb-1"
              >
                Email (optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              />
              <p className="mt-1 text-xs text-warm-gray-500">
                If set, only this email can use the invite
              </p>
            </div>

            {email && (
              <div className="flex items-center gap-2">
                <input
                  id="sendEmail"
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-gray-300 text-coral focus:ring-coral/20"
                />
                <label
                  htmlFor="sendEmail"
                  className="text-sm text-warm-gray-700"
                >
                  Send invitation email
                </label>
              </div>
            )}

            {email && role === "creator" && (
              <div className="space-y-2 pt-2 border-t border-warm-gray-100">
                <p className="text-xs text-warm-gray-500">
                  Social media handles (optional)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Instagram"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                  <input
                    type="text"
                    placeholder="TikTok"
                    value={tiktokHandle}
                    onChange={(e) => setTiktokHandle(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                  <input
                    type="text"
                    placeholder="YouTube"
                    value={youtubeHandle}
                    onChange={(e) => setYoutubeHandle(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                  <input
                    type="text"
                    placeholder="Facebook"
                    value={facebookHandle}
                    onChange={(e) => setFacebookHandle(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                  <input
                    type="text"
                    placeholder="X (Twitter)"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="expiration"
                className="block text-sm font-medium text-warm-gray-700 mb-1"
              >
                Expires in
              </label>
              <select
                id="expiration"
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 text-sm font-medium text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-[--radius-md] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-sm font-medium text-white bg-gradient-to-r from-coral to-rose hover:opacity-90 rounded-[--radius-md] transition-opacity disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
