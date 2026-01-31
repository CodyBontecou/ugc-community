"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConvertInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConverted: () => void;
  invite: {
    id: string;
    email: string;
    role?: string;
    socials?: {
      instagram?: string | string[] | null;
      tiktok?: string | string[] | null;
      youtube?: string | string[] | null;
      twitter?: string | string[] | null;
    } | null;
  } | null;
}

export function ConvertInviteDialog({
  isOpen,
  onClose,
  onConverted,
  invite,
}: ConvertInviteDialogProps) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDisplayName("");
      setBio("");
      setError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/invites/${invite.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          displayName: displayName || undefined,
          bio: bio || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to convert invite");
      }

      onConverted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert invite");
    } finally {
      setLoading(false);
    }
  }

  if (!invite) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[--radius-xl] shadow-xl z-50"
          >
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-warm-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-warm-gray-900">
                      Convert to User
                    </h2>
                    <p className="text-sm text-warm-gray-500">
                      Create a user account from this invite
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-warm-gray-400 hover:text-warm-gray-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={invite.email}
                    disabled
                    className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] bg-warm-gray-50 text-warm-gray-600 text-sm"
                  />
                </div>

                {/* Role (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                    Role
                  </label>
                  <div className="px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] bg-warm-gray-50 text-warm-gray-600 text-sm">
                    {invite.role === "brand" ? "Brand" : "Creator"}
                  </div>
                </div>

                {/* Name (required) */}
                <div>
                  <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>

                {/* Display Name (optional) */}
                <div>
                  <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Public display name (optional)"
                    className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>

                {/* Bio (optional) */}
                <div>
                  <label className="block text-sm font-medium text-warm-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral resize-none"
                  />
                </div>

                {/* Social handles info */}
                {invite.socials && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Social handles from waitlist will be imported automatically.
                    </p>
                  </div>
                )}

                {/* Sign-in info */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    The user will be able to sign in using Google OAuth with{" "}
                    <strong>{invite.email}</strong>.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-warm-gray-200 bg-warm-gray-50 rounded-b-[--radius-xl]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-warm-gray-700 hover:text-warm-gray-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "#1A1614", color: "#FFFFFF" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
