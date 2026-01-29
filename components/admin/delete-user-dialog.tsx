"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  user: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
}

export function DeleteUserDialog({
  isOpen,
  onClose,
  onDeleted,
  user,
}: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  async function handleDelete() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      onDeleted();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setError(null);
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
            Delete User
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-warm-gray-400 hover:text-warm-gray-600 rounded transition-colors"
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
                All user data including their profile, sessions, and media will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="bg-warm-gray-50 p-3 rounded-[--radius-md]">
            <p className="text-sm text-warm-gray-600">
              You are about to delete:
            </p>
            <p className="text-sm font-medium text-warm-gray-900 mt-1">
              {user.name || "Unknown user"}
            </p>
            <p className="text-xs text-warm-gray-500">{user.email}</p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200 rounded-[--radius-md] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-[--radius-md] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
