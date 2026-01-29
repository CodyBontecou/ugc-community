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
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Github size={16} className="text-warm-gray-400" />
          <span className="text-sm text-warm-gray-500">Loading GitHub status...</span>
          <Loader2 size={14} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  // Compact connected state
  if (status?.connected) {
    return (
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 px-4 py-3">
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <Github size={14} className="text-green-700" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-warm-gray-900">GitHub</span>
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Connected</span>
              <a
                href={`https://github.com/${status.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-warm-gray-600 hover:text-warm-gray-800 flex items-center gap-1"
              >
                @{status.username}
                <LinkIcon size={10} />
              </a>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-warm-gray-500 hover:text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disconnecting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Disconnecting...</span>
              </>
            ) : (
              <>
                <Unlink size={12} />
                <span>Disconnect</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Not connected state - slightly more prominent
  return (
    <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-4">
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Github size={18} className="text-warm-gray-400" />
          <div>
            <p className="text-sm font-medium text-warm-gray-900">GitHub Integration</p>
            <p className="text-xs text-warm-gray-500">Connect to manage creator deployments</p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-3 py-1.5 bg-warm-gray-900 text-white hover:bg-warm-gray-800 rounded text-sm font-medium transition-colors"
        >
          <Github size={14} />
          Connect
        </button>
      </div>
    </div>
  );
}
