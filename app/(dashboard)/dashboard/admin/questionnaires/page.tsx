"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  Search,
  X,
  ExternalLink,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";

interface Questionnaire {
  id: string;
  userId: string;
  portfolioVision: string;
  inspiringBrands: string | null;
  portfolioExamples: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  userSubdomain: string | null;
}

interface GenerationResult {
  success: boolean;
  generationId?: string;
  githubRepo?: string;
  githubRepoUrl?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  filesGenerated?: number;
  error?: string;
}

interface GenerationStatus {
  id: string;
  status: string;
  githubRepo: string | null;
  deploymentUrl: string | null;
  previewUrl: string | null;
  filesGenerated: number | null;
  error: string | null;
  errorStep: string | null;
  startedAt: string;
  completedAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued...",
  generating: "Generating with AI...",
  pushing: "Pushing to GitHub...",
  deploying: "Deploying to Vercel...",
  completed: "Completed",
  failed: "Failed",
};

export default function AdminQuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generationResults, setGenerationResults] = useState<Map<string, GenerationResult>>(new Map());
  const [generationStatuses, setGenerationStatuses] = useState<Map<string, GenerationStatus>>(new Map());
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [promptPreviewId, setPromptPreviewId] = useState<string | null>(null);
  const [promptPreviewText, setPromptPreviewText] = useState("");
  const [promptPreviewError, setPromptPreviewError] = useState<string | null>(null);
  const [isPromptPreviewLoading, setIsPromptPreviewLoading] = useState(false);

  const fetchGenerationStatus = useCallback(async (questionnaireId: string) => {
    try {
      const response = await fetch(
        `/api/admin/questionnaires/${questionnaireId}/generate/status`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.generation) {
          setGenerationStatuses((prev) => {
            const next = new Map(prev);
            next.set(questionnaireId, data.generation);
            return next;
          });
          return data.generation as GenerationStatus;
        }
      }
    } catch (err) {
      console.error("Error fetching generation status:", err);
    }
    return null;
  }, []);

  const fetchQuestionnaires = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/questionnaires");
      if (response.ok) {
        const data = await response.json();
        const loadedQuestionnaires = data.questionnaires || [];
        setQuestionnaires(loadedQuestionnaires);

        // Fetch status for each questionnaire
        for (const q of loadedQuestionnaires) {
          fetchGenerationStatus(q.id);
        }
      } else if (response.status === 403) {
        setError("Admin access required");
      } else {
        setError("Failed to load questionnaires");
      }
    } catch (err) {
      console.error("Error fetching questionnaires:", err);
      setError("Failed to load questionnaires");
    } finally {
      setIsLoading(false);
    }
  }, [fetchGenerationStatus]);

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  // Poll for status updates when generating
  useEffect(() => {
    if (!pollingId) return;

    const intervalId = setInterval(async () => {
      const status = await fetchGenerationStatus(pollingId);
      if (status && (status.status === "completed" || status.status === "failed")) {
        setPollingId(null);
        setGeneratingId(null);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [pollingId, fetchGenerationStatus]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const closePromptPreview = () => {
    setPromptPreviewId(null);
    setPromptPreviewText("");
    setPromptPreviewError(null);
    setIsPromptPreviewLoading(false);
  };

  const openPromptPreview = async (questionnaireId: string) => {
    setPromptPreviewId(questionnaireId);
    setPromptPreviewText("");
    setPromptPreviewError(null);
    setIsPromptPreviewLoading(true);

    try {
      const response = await fetch(
        `/api/admin/questionnaires/${questionnaireId}/generate/prompt`
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setPromptPreviewError(data?.error || "Failed to load prompt preview");
        return;
      }

      setPromptPreviewText(data?.prompt || "");
    } catch (err) {
      console.error("Prompt preview error:", err);
      setPromptPreviewError("Failed to load prompt preview. Please try again.");
    } finally {
      setIsPromptPreviewLoading(false);
    }
  };

  const handleConfirmGenerate = async () => {
    if (!promptPreviewId) return;
    const questionnaireId = promptPreviewId;
    closePromptPreview();
    await handleGenerate(questionnaireId);
  };

  const handleGenerate = async (questionnaireId: string) => {
    if (generatingId) return; // Prevent double-clicks

    setGeneratingId(questionnaireId);
    // Clear any previous status/result
    setGenerationStatuses((prev) => {
      const next = new Map(prev);
      next.delete(questionnaireId);
      return next;
    });
    setGenerationResults((prev) => {
      const next = new Map(prev);
      next.delete(questionnaireId);
      return next;
    });

    try {
      const response = await fetch(
        `/api/admin/questionnaires/${questionnaireId}/generate`,
        { method: "POST" }
      );
      const data: GenerationResult = await response.json();

      if (data.generationId) {
        // Start polling for status updates
        setPollingId(questionnaireId);
        // Also fetch initial status
        await fetchGenerationStatus(questionnaireId);
      } else {
        // Fallback for immediate response (shouldn't happen with new flow)
        setGenerationResults((prev) => {
          const next = new Map(prev);
          next.set(questionnaireId, data);
          return next;
        });
        setGeneratingId(null);
      }
    } catch (err) {
      console.error("Generation error:", err);
      setGenerationResults((prev) => {
        const next = new Map(prev);
        next.set(questionnaireId, {
          success: false,
          error: "Network error. Please try again.",
        });
        return next;
      });
      setGeneratingId(null);
    }
  };

  // Filter by search
  const filtered = questionnaires.filter((q) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      q.userName.toLowerCase().includes(searchLower) ||
      q.userEmail.toLowerCase().includes(searchLower) ||
      q.portfolioVision.toLowerCase().includes(searchLower) ||
      q.inspiringBrands?.toLowerCase().includes(searchLower) ||
      q.portfolioExamples?.toLowerCase().includes(searchLower)
    );
  });

  const promptPreviewQuestionnaire = promptPreviewId
    ? questionnaires.find((q) => q.id === promptPreviewId)
    : null;
  const promptPreviewStatus = promptPreviewId
    ? generationStatuses.get(promptPreviewId)
    : null;
  const promptPreviewActionLabel =
    promptPreviewStatus?.status === "completed"
      ? "Regenerate Website"
      : "Generate Website";

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Admin
        </Link>

        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Admin
        </Link>
        <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Portfolio Questionnaires
        </h1>
        <p className="text-warm-gray-500">
          View creator responses about their portfolio preferences
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-4 mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, email, or response content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray-400 hover:text-warm-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-sm text-warm-gray-500 mb-4">
          {filtered.length} response{filtered.length !== 1 ? "s" : ""}
          {search ? " found" : " total"}
        </p>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-warm-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-warm-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">
            No questionnaires found
          </h3>
          <p className="text-warm-gray-500">
            {search
              ? "Try adjusting your search."
              : "No creators have submitted their portfolio preferences yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((questionnaire) => {
            const isExpanded = expandedIds.has(questionnaire.id);
            const status = generationStatuses.get(questionnaire.id);
            const isActiveGeneration = status && !["completed", "failed"].includes(status.status);

            return (
              <div
                key={questionnaire.id}
                className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden"
              >
                {/* Header - always visible */}
                <button
                  onClick={() => toggleExpanded(questionnaire.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-warm-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  {questionnaire.userImage ? (
                    <img
                      src={questionnaire.userImage}
                      alt={questionnaire.userName}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white font-medium flex-shrink-0">
                      {questionnaire.userName.charAt(0)}
                    </div>
                  )}

                  {/* User info */}
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-medium text-warm-gray-900">
                      {questionnaire.userName}
                    </h3>
                    <p className="text-sm text-warm-gray-500 truncate">
                      {questionnaire.userEmail}
                    </p>
                    {questionnaire.userSubdomain && (
                      <p className="text-xs text-coral">
                        {questionnaire.userSubdomain}.ugc.community
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  {status && (
                    <div className="flex-shrink-0 hidden sm:block">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          status.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : status.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isActiveGeneration && (
                          <Loader2 size={12} className="animate-spin" />
                        )}
                        {STATUS_LABELS[status.status] || status.status}
                      </span>
                    </div>
                  )}

                  {/* Submitted date */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-warm-gray-400">Submitted</p>
                    <p className="text-sm text-warm-gray-600">
                      {formatDistanceToNow(new Date(questionnaire.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Expand/collapse icon */}
                  <div className="flex-shrink-0 text-warm-gray-400">
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-warm-gray-100">
                    <div className="pt-4 space-y-6">
                      {/* Portfolio Vision */}
                      <div>
                        <h4 className="text-sm font-semibold text-warm-gray-900 mb-2">
                          Portfolio Vision
                        </h4>
                        <p className="text-sm text-warm-gray-700 whitespace-pre-wrap bg-warm-gray-50 rounded-[--radius-md] p-4">
                          {questionnaire.portfolioVision}
                        </p>
                      </div>

                      {/* Inspiring Brands */}
                      {questionnaire.inspiringBrands && (
                        <div>
                          <h4 className="text-sm font-semibold text-warm-gray-900 mb-2">
                            Inspiring Brands
                          </h4>
                          <p className="text-sm text-warm-gray-700 whitespace-pre-wrap bg-warm-gray-50 rounded-[--radius-md] p-4">
                            {questionnaire.inspiringBrands}
                          </p>
                        </div>
                      )}

                      {/* Portfolio Examples */}
                      {questionnaire.portfolioExamples && (
                        <div>
                          <h4 className="text-sm font-semibold text-warm-gray-900 mb-2">
                            Portfolio Examples
                          </h4>
                          <p className="text-sm text-warm-gray-700 whitespace-pre-wrap bg-warm-gray-50 rounded-[--radius-md] p-4">
                            {questionnaire.portfolioExamples}
                          </p>
                        </div>
                      )}

                      {/* Generation Status */}
                      {status && (
                        <div
                          className={`rounded-[--radius-md] p-4 ${
                            status.status === "completed"
                              ? "bg-green-50 border border-green-200"
                              : status.status === "failed"
                              ? "bg-red-50 border border-red-200"
                              : "bg-amber-50 border border-amber-200"
                          }`}
                        >
                          {status.status === "completed" ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-green-800">
                                Portfolio generated successfully!
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {status.previewUrl && (
                                  <a
                                    href={status.previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                                  >
                                    <ExternalLink size={14} />
                                    View Site
                                  </a>
                                )}
                                {status.githubRepo && (
                                  <a
                                    href={`https://github.com/${status.githubRepo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                                  >
                                    <FileText size={14} />
                                    View Code
                                  </a>
                                )}
                              </div>
                              {status.filesGenerated && (
                                <p className="text-xs text-green-600">
                                  {status.filesGenerated} files generated
                                </p>
                              )}
                              {status.completedAt && (
                                <p className="text-xs text-green-500">
                                  Completed{" "}
                                  {formatDistanceToNow(new Date(status.completedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              )}
                            </div>
                          ) : status.status === "failed" ? (
                            <div>
                              <p className="text-sm font-medium text-red-800">
                                Generation failed
                              </p>
                              <p className="text-sm text-red-600">
                                {status.error}
                              </p>
                              {status.errorStep && (
                                <p className="text-xs text-red-500 mt-1">
                                  Failed at step: {status.errorStep}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">
                                  {STATUS_LABELS[status.status] || status.status}
                                </p>
                                <p className="text-xs text-amber-600">
                                  Started{" "}
                                  {formatDistanceToNow(new Date(status.startedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link
                          href={`/dashboard/admin/users/${questionnaire.userId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warm-gray-700 bg-warm-gray-100 rounded-full hover:bg-warm-gray-200 transition-colors"
                        >
                          <User size={16} />
                          View User
                        </Link>
                        {questionnaire.userSubdomain && (
                          <a
                            href={`https://${questionnaire.userSubdomain}.ugc.community`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-coral bg-coral/10 rounded-full hover:bg-coral/20 transition-colors"
                          >
                            <ExternalLink size={16} />
                            View Portfolio
                          </a>
                        )}
                        {questionnaire.userSubdomain && (
                          <button
                            onClick={() => openPromptPreview(questionnaire.id)}
                            disabled={generatingId !== null || isActiveGeneration}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                              generatingId === questionnaire.id || isActiveGeneration
                                ? "bg-warm-gray-200 text-warm-gray-500 cursor-wait"
                                : generatingId !== null
                                ? "bg-warm-gray-100 text-warm-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-coral to-rose text-white hover:opacity-90"
                            }`}
                          >
                            {generatingId === questionnaire.id || isActiveGeneration ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                {isActiveGeneration
                                  ? STATUS_LABELS[status!.status]
                                  : "Starting..."}
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} />
                                {status?.status === "completed"
                                  ? "Regenerate Website"
                                  : "Generate Website"}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {promptPreviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closePromptPreview}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-[--radius-xl] border border-warm-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-warm-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-warm-gray-900">
                  Prompt Preview
                </h2>
                <p className="text-sm text-warm-gray-500">
                  Review the prompt for{" "}
                  {promptPreviewQuestionnaire?.userName || "this creator"} before
                  generating.
                </p>
              </div>
              <button
                onClick={closePromptPreview}
                className="text-warm-gray-400 hover:text-warm-gray-600"
                aria-label="Close prompt preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-auto">
              {isPromptPreviewLoading ? (
                <div className="flex items-center gap-2 text-warm-gray-500 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Loading prompt...
                </div>
              ) : promptPreviewError ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-600">{promptPreviewError}</p>
                  <button
                    onClick={() => promptPreviewId && openPromptPreview(promptPreviewId)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <pre className="text-xs text-warm-gray-700 whitespace-pre-wrap font-mono bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-md] p-4">
                  {promptPreviewText || "No prompt available."}
                </pre>
              )}
            </div>

            <div className="px-6 py-4 border-t border-warm-gray-200 bg-warm-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={closePromptPreview}
                className="px-4 py-2 text-sm font-medium text-warm-gray-600 hover:text-warm-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGenerate}
                disabled={
                  isPromptPreviewLoading ||
                  !!promptPreviewError ||
                  !promptPreviewText.trim()
                }
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={16} />
                {promptPreviewActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
