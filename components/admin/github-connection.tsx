"use client";

import { useState, useEffect } from "react";
import { Github, Loader2, LinkIcon, Unlink } from "lucide-react";

interface GitHubStatus {
  connected: boolean;
  username: string | null;
  connectedAt: string | null;
}

export function GitHubConnection() {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();

    // Check URL params for success/error messages
    const params = new URLSearchParams(window.location.search);
    if (params.get("github_connected") === "true") {
      // Refetch status after connection
      fetchStatus();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("github_error")) {
      setError(params.get("github_error"));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/github/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError("Failed to load GitHub status");
      }
    } catch {
      setError("Failed to load GitHub status");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect your GitHub account?")) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);
      const response = await fetch("/api/admin/github/disconnect", {
        method: "DELETE",
      });

      if (response.ok) {
        setStatus({ connected: false, username: null, connectedAt: null });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to disconnect");
      }
    } catch {
      setError("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  function handleConnect() {
    // Redirect to OAuth flow
    window.location.href = "/api/admin/github/connect";
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Github size={20} className="text-warm-gray-600" />
          <h3 className="text-lg font-semibold text-warm-gray-900">
            GitHub Integration
          </h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 size={24} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Github size={20} className="text-warm-gray-600" />
        <h3 className="text-lg font-semibold text-warm-gray-900">
          GitHub Integration
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Github size={20} className="text-green-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">Connected</p>
              <a
                href={`https://github.com/${status.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 hover:text-green-800 flex items-center gap-1"
              >
                @{status.username}
                <LinkIcon size={12} />
              </a>
            </div>
          </div>

          {status.connectedAt && (
            <p className="text-sm text-warm-gray-500">
              Connected on{" "}
              {new Date(status.connectedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disconnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unlink size={16} />
                Disconnect GitHub
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-warm-gray-600 text-sm">
            Connect your GitHub account to manage creator deployments and
            repositories.
          </p>

          <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-4 py-2 bg-warm-gray-900 text-white hover:bg-warm-gray-800 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Github size={16} />
            Connect GitHub
          </button>

          <p className="text-xs text-warm-gray-500">
            This will request access to your repositories for deployment
            management.
          </p>
        </div>
      )}
    </div>
  );
}
