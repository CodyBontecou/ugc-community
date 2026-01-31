"use client";

import { useState, useEffect } from "react";
import { Radio, Loader2, Play, CheckCircle, AlertCircle, RefreshCw, Database, ChevronDown, ChevronUp } from "lucide-react";

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

interface ApifyRun {
  id: string;
  actorId: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  datasetId: string;
  origin: string;
}

interface ReprocessResult {
  success: boolean;
  itemsInDataset: number;
  saved: number;
  duplicates: number;
  matched: number;
  errors?: string[];
}

export function MonitoringTrigger() {
  const [info, setInfo] = useState<MonitoringInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<TriggerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reprocess state
  const [showReprocess, setShowReprocess] = useState(false);
  const [runs, setRuns] = useState<ApifyRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [reprocessResult, setReprocessResult] = useState<ReprocessResult | null>(null);
  const [manualDatasetId, setManualDatasetId] = useState("");

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

  async function fetchRuns() {
    try {
      setLoadingRuns(true);
      const response = await fetch("/api/admin/monitoring/reprocess");
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingRuns(false);
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

  async function handleReprocess(datasetId: string) {
    try {
      setReprocessing(datasetId);
      setError(null);
      setReprocessResult(null);

      const response = await fetch("/api/admin/monitoring/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId }),
      });

      const data = await response.json();

      if (response.ok) {
        setReprocessResult(data);
      } else {
        setError(data.error || "Failed to reprocess dataset");
      }
    } catch {
      setError("Failed to reprocess dataset");
    } finally {
      setReprocessing(null);
    }
  }

  function toggleReprocess() {
    const newShow = !showReprocess;
    setShowReprocess(newShow);
    if (newShow && runs.length === 0) {
      fetchRuns();
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
        Automatically runs weekly on Sundays at 6 AM UTC. Scrapes registered user profiles and filters for @ugc.community mentions.
      </p>

      {/* Reprocess Section */}
      <div className="mt-4 pt-4 border-t border-warm-gray-100">
        <button
          onClick={toggleReprocess}
          className="flex items-center gap-2 text-sm text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
        >
          <Database size={14} />
          <span>Reprocess Dataset</span>
          {showReprocess ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showReprocess && (
          <div className="mt-3 space-y-3">
            {reprocessResult && (
              <div
                className={`p-2 rounded text-xs ${
                  reprocessResult.matched > 0
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>
                    Processed {reprocessResult.itemsInDataset} items: {reprocessResult.saved} saved, {reprocessResult.duplicates} duplicates, <strong>{reprocessResult.matched} matched</strong>
                  </span>
                </div>
                {reprocessResult.errors && reprocessResult.errors.length > 0 && (
                  <div className="mt-1 text-red-600">
                    Errors: {reprocessResult.errors.slice(0, 2).join(", ")}
                    {reprocessResult.errors.length > 2 && ` (+${reprocessResult.errors.length - 2} more)`}
                  </div>
                )}
              </div>
            )}

            {/* Manual dataset ID input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={manualDatasetId}
                onChange={(e) => setManualDatasetId(e.target.value)}
                placeholder="Enter dataset ID..."
                className="flex-1 px-2 py-1.5 text-xs border border-warm-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={() => handleReprocess(manualDatasetId)}
                disabled={!manualDatasetId || reprocessing !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reprocessing === manualDatasetId ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Reprocess
              </button>
            </div>

            {/* Recent runs */}
            {loadingRuns ? (
              <div className="flex items-center gap-2 text-xs text-warm-gray-500">
                <Loader2 size={12} className="animate-spin" />
                Loading recent runs...
              </div>
            ) : runs.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs text-warm-gray-500">Recent runs:</p>
                {runs.filter(r => r.status === "SUCCEEDED").slice(0, 5).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-2 bg-warm-gray-50 rounded text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-warm-gray-600">{run.datasetId}</span>
                      <span className="ml-2 text-warm-gray-400">
                        {new Date(run.finishedAt).toLocaleString()}
                      </span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                        run.origin === "API"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {run.origin}
                      </span>
                    </div>
                    <button
                      onClick={() => handleReprocess(run.datasetId)}
                      disabled={reprocessing !== null}
                      className="flex items-center gap-1 px-2 py-1 bg-white border border-warm-gray-200 hover:border-purple-300 rounded text-warm-gray-600 hover:text-purple-600 transition-colors disabled:opacity-50"
                    >
                      {reprocessing === run.datasetId ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <RefreshCw size={10} />
                      )}
                      Reprocess
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-warm-gray-400">No recent runs found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
