"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, EyeOff, Loader2 } from "lucide-react";

interface PublishManagerProps {
  isPublished: boolean;
  hasSubdomain: boolean;
}

export function PublishManager({ isPublished, hasSubdomain }: PublishManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handlePublish() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish");
      }

      router.refresh();
    } catch (err) {
      console.error("Failed to publish:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnpublish() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unpublish");
      }

      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to unpublish:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
        <button
          onClick={() => setError(null)}
          className="ml-2 underline hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (isPublished) {
    // Show unpublish UI
    if (showConfirm) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-warm-gray-600">
            Are you sure you want to unpublish? Your portfolio will no longer be
            visible to the public.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleUnpublish}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <EyeOff size={16} />
              )}
              {isLoading ? "Unpublishing..." : "Yes, Unpublish"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-warm-gray-100 text-warm-gray-700 rounded-lg hover:bg-warm-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-warm-gray-700 bg-white border border-warm-gray-200 rounded-lg hover:bg-warm-gray-50 transition-colors"
      >
        <EyeOff size={16} />
        Unpublish Portfolio
      </button>
    );
  }

  // Show publish UI
  return (
    <button
      onClick={handlePublish}
      disabled={isLoading || !hasSubdomain}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Globe size={18} />
      )}
      {isLoading ? "Publishing..." : "Publish Portfolio"}
    </button>
  );
}
