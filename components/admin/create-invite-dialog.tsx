"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";

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
  const [expirationDays, setExpirationDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          expirationDays,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invite");
      }

      const data = await res.json();
      setCreatedUrl(data.invite.url);
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
    setExpirationDays(7);
    setError(null);
    setCreatedUrl(null);
    setCopied(false);
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
            <p className="text-sm text-warm-gray-600">
              Invite created successfully! Share this link:
            </p>
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
                className="flex-1 py-2 text-sm font-medium text-white bg-warm-gray-900 hover:bg-warm-gray-800 rounded-[--radius-md] transition-colors disabled:opacity-50"
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
