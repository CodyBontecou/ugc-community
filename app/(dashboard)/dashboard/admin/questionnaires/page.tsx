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

export default function AdminQuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
        <p className="text-warm-gray-500">View creator responses about their portfolio preferences</p>
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400" />
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

      {!isLoading && (
        <p className="text-sm text-warm-gray-500 mb-4">
          {filtered.length} response{filtered.length !== 1 ? "s" : ""}
          {search ? " found" : " total"}
        </p>
      )}

      {isLoading ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-warm-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-warm-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">No questionnaires found</h3>
          <p className="text-warm-gray-500">
            {search ? "Try adjusting your search." : "No creators have submitted their portfolio preferences yet."}
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
                <button
                  onClick={() => toggleExpanded(questionnaire.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-warm-gray-50 transition-colors"
                >
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

                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-medium text-warm-gray-900">{questionnaire.userName}</h3>
                    <p className="text-sm text-warm-gray-500 truncate">{questionnaire.userEmail}</p>
                    {questionnaire.userSubdomain && (
                      <p className="text-xs text-coral">{questionnaire.userSubdomain}.ugc.community</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-warm-gray-400">Submitted</p>
                    <p className="text-sm text-warm-gray-600">
                      {formatDistanceToNow(new Date(questionnaire.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-warm-gray-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-warm-gray-100">
                    <div className="pt-4 space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-warm-gray-900 mb-2">Portfolio Vision</h4>
                        <p className="text-sm text-warm-gray-700 whitespace-pre-wrap bg-warm-gray-50 rounded-[--radius-md] p-4">
                          {questionnaire.portfolioVision}
                        </p>
                      </div>

                      {questionnaire.inspiringBrands && (
                        <div>
                          <h4 className="text-sm font-semibold text-warm-gray-900 mb-2">Inspiring Brands</h4>
                          <p className="text-sm text-warm-gray-700 whitespace-pre-wrap bg-warm-gray-50 rounded-[--radius-md] p-4">
                            {questionnaire.inspiringBrands}
                          </p>
                        </div>
                      )}

                      {questionnaire.portfolioExamples && (
                        <div>
                          <h4 className="text-sm font-semibold text-warm-gray-900 mb-2">Portfolio Examples</h4>
                          <p className="text-sm text-warm-gray-700 whitespace-pre-wrap bg-warm-gray-50 rounded-[--radius-md] p-4">
                            {questionnaire.portfolioExamples}
                          </p>
                        </div>
                      )}

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
