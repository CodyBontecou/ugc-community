"use client";

import { useState, useEffect } from "react";
import { Radio, Loader2, Play, CheckCircle, AlertCircle } from "lucide-react";

interface PlatformInfo {
  platform: string;
  handleCount: number;
  handles: string[];
}

interface MonitoringInfo {
  platforms: PlatformInfo[];
  totalHandles: number;
}

interface TriggerResult {
  platform: string;
  success: boolean;
  runId?: string;
  error?: string;
}

interface TriggerResponse {
  success: boolean;
  results: TriggerResult[];
  summary: {
    totalPlatforms: number;
    successCount: number;
    failureCount: number;
    totalHandles: number;
  };
}

export function MonitoringTrigger() {
  const [info, setInfo] = useState<MonitoringInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<TriggerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInfo();
  }, []);

  async function fetchInfo() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/monitoring/trigger");
      if (response.ok) {
        const data = await response.json();
        setInfo(data);
      } else {
        setError("Failed to load monitoring info");
      }
    } catch {
      setError("Failed to load monitoring info");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrigger() {
    if (!confirm("This will start scraping all registered user profiles. Continue?")) {
      return;
    }

    try {
      setTriggering(true);
      setError(null);
      setLastResult(null);

      const response = await fetch("/api/admin/monitoring/trigger", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult(data);
      } else {
        setError(data.error || "Failed to trigger monitoring");
      }
    } catch {
      setError("Failed to trigger monitoring");
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-warm-gray-400" />
          <span className="text-sm text-warm-gray-500">Loading monitoring info...</span>
          <Loader2 size={14} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-4">
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {lastResult && (
        <div
          className={`mb-3 p-2 rounded text-xs flex items-center gap-2 ${
            lastResult.success
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-yellow-50 border border-yellow-200 text-yellow-700"
          }`}
        >
          <CheckCircle size={14} />
          <span>
            Triggered {lastResult.summary.successCount} of {lastResult.summary.totalPlatforms} platforms.
            {lastResult.results.map((r) => (
              <span key={r.platform} className="ml-2">
                {r.platform}: {r.success ? `Run ${r.runId?.slice(0, 8)}...` : r.error}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
            <Radio size={14} className="text-purple-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-warm-gray-900">Profile Monitoring</p>
            <p className="text-xs text-warm-gray-500">
              {info?.totalHandles || 0} handles across {info?.platforms.length || 0} platforms
              {info?.platforms.map((p) => (
                <span key={p.platform} className="ml-1">
                  ({p.platform}: {p.handleCount})
                </span>
              ))}
            </p>
          </div>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering || !info?.totalHandles}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {triggering ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Triggering...
            </>
          ) : (
            <>
              <Play size={14} />
              Run Now
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-xs text-warm-gray-400">
        Automatically runs weekly on Sundays at 6 AM UTC. Scrapes registered user profiles and filters for #ugccommunity posts.
      </p>
    </div>
  );
}
