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

interface TriggerResponse {
  success: boolean;
  scrape: {
    platforms: Array<{
      platform: string;
      totalHandles: number;
      scraped: number;
      skipped: number;
      postsFound: number;
    }>;
    totalScraped: number;
    totalSkipped: number;
    totalPostsFound: number;
  };
  processing: {
    saved: number;
    duplicates: number;
    matched: number;
  };
  errors?: string[];
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
    if (!confirm("This will scrape all registered user profiles via Scrape Creators. Continue?")) {
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
          className={`mb-3 p-2 rounded text-xs ${
            lastResult.success
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-yellow-50 border border-yellow-200 text-yellow-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={14} />
            <span>
              Scraped {lastResult.scrape.totalScraped} profiles, skipped {lastResult.scrape.totalSkipped} (no new content).
              Found {lastResult.scrape.totalPostsFound} posts.
              Saved {lastResult.processing.saved}, matched {lastResult.processing.matched}, dupes {lastResult.processing.duplicates}.
            </span>
          </div>
          {lastResult.scrape.platforms.map((p) => (
            <div key={p.platform} className="mt-1 ml-6 text-warm-gray-600">
              {p.platform}: {p.scraped} scraped, {p.skipped} skipped, {p.postsFound} posts
            </div>
          ))}
          {lastResult.errors && lastResult.errors.length > 0 && (
            <div className="mt-1 ml-6 text-red-600">
              Errors: {lastResult.errors.slice(0, 3).join(", ")}
              {lastResult.errors.length > 3 && ` (+${lastResult.errors.length - 3} more)`}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center">
            <Radio size={14} className="text-coral" />
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
          className="flex items-center gap-2 px-3 py-1.5 bg-warm-gray-900 text-white hover:bg-warm-gray-800 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {triggering ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Scraping...
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
        Runs every 12 hours via cron. Peeks at profile counts first — only fetches posts if new content detected. Powered by Scrape Creators API.
      </p>
    </div>
  );
}
