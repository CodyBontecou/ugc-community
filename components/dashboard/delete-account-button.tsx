"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteAccountButtonProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function DeleteAccountButton({ userName, userEmail }: DeleteAccountButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Redirect to home page after successful deletion
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setShowDialog(false);
      setError(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-[--radius-md] transition-colors"
      >
        <Trash2 size={16} />
        Delete Account
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-warm-gray-900/50"
            onClick={handleClose}
          />
          <div className="relative bg-white rounded-[--radius-xl] shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-warm-gray-200">
              <h2 className="text-lg font-semibold text-warm-gray-900">
                Delete Account
              </h2>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="p-1 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-[--radius-md]">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">This action cannot be undone.</p>
                  <p className="mt-1">
                    All your data including your profile, posts, milestones, and uploaded media will be permanently deleted.
                  </p>
                </div>
              </div>

              {(userName || userEmail) && (
                <div className="bg-warm-gray-50 p-3 rounded-[--radius-md]">
                  <p className="text-sm text-warm-gray-600">
                    You are about to delete:
                  </p>
                  {userName && (
                    <p className="text-sm font-medium text-warm-gray-900 mt-1">
                      {userName}
                    </p>
                  )}
                  {userEmail && (
                    <p className="text-xs text-warm-gray-500">{userEmail}</p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="flex-1 py-2 text-sm font-medium text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-[--radius-md] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-[--radius-md] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
