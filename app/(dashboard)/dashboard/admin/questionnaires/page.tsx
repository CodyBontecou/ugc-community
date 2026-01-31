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
  githubRepo?: string;
  githubRepoUrl?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  filesGenerated?: number;
  error?: string;
}

export default function AdminQuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generationResults, setGenerationResults] = useState<Map<string, GenerationResult>>(new Map());

  const fetchQuestionnaires = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/questionnaires");
      if (response.ok) {
        const data = await response.json();
        setQuestionnaires(data.questionnaires || []);
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
  }, []);

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

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

  const handleGenerate = async (questionnaireId: string) => {
    if (generatingId) return; // Prevent double-clicks

    setGeneratingId(questionnaireId);
    // Clear any previous result for this questionnaire
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

      setGenerationResults((prev) => {
        const next = new Map(prev);
        next.set(questionnaireId, data);
        return next;
      });
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
    } finally {
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

                      {/* Generation Result */}
                      {generationResults.get(questionnaire.id) && (
                        <div
                          className={`rounded-[--radius-md] p-4 ${
                            generationResults.get(questionnaire.id)?.success
                              ? "bg-green-50 border border-green-200"
                              : "bg-red-50 border border-red-200"
                          }`}
                        >
                          {generationResults.get(questionnaire.id)?.success ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-green-800">
                                Portfolio generated successfully!
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {generationResults.get(questionnaire.id)
                                  ?.previewUrl && (
                                  <a
                                    href={
                                      generationResults.get(questionnaire.id)
                                        ?.previewUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                                  >
                                    <ExternalLink size={14} />
                                    View Site
                                  </a>
                                )}
                                {generationResults.get(questionnaire.id)
                                  ?.githubRepoUrl && (
                                  <a
                                    href={
                                      generationResults.get(questionnaire.id)
                                        ?.githubRepoUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                                  >
                                    <FileText size={14} />
                                    View Code
                                  </a>
                                )}
                              </div>
                              <p className="text-xs text-green-600">
                                {generationResults.get(questionnaire.id)
                                  ?.filesGenerated || 0}{" "}
                                files generated
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-red-800">
                                Generation failed
                              </p>
                              <p className="text-sm text-red-600">
                                {generationResults.get(questionnaire.id)?.error}
                              </p>
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
                            onClick={() => handleGenerate(questionnaire.id)}
                            disabled={generatingId !== null}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                              generatingId === questionnaire.id
                                ? "bg-warm-gray-200 text-warm-gray-500 cursor-wait"
                                : generatingId !== null
                                ? "bg-warm-gray-100 text-warm-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-coral to-rose text-white hover:opacity-90"
                            }`}
                          >
                            {generatingId === questionnaire.id ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} />
                                Generate Website
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
    </div>
  );
}
