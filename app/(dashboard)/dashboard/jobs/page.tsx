"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Loader2, Hash, Clock, Eye } from "lucide-react";
import { JobHooksTable } from "@/components/jobs/job-hooks-table";
import type { Platform, CompensationType } from "@/lib/jobs/constants";

interface Job {
  id: string;
  title: string;
  description: string;
  hooks: string[];
  compensationType: string;
  compensationDetails: string | null;
  niches: string[];
  platforms: string[];
  status: string;
  isFeatured: boolean;
  deadlineAt: string | null;
  viewCount: number;
  createdAt: string;
  publishedAt: string | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else if (response.status === 401) {
        setError("Please sign in to view jobs");
      } else {
        setError("Failed to load jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Content Jobs
        </h1>
        <p className="text-warm-gray-500">
          Browse active content jobs. Tag <span className="font-semibold">@ugc.community</span> in your TikTok posts —
          we'll automatically detect and credit your content.
        </p>
      </div>

      {/* How it works banner */}
      <div className="bg-gradient-to-r from-coral/5 to-rose/5 rounded-[--radius-xl] border border-coral/20 p-6 mb-8">
        <h2 className="text-base font-semibold text-warm-gray-900 mb-3">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-warm-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold text-xs flex-shrink-0 mt-0.5">1</span>
            <span>Pick a job and check the details</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold text-xs flex-shrink-0 mt-0.5">2</span>
            <span>Create TikTok content and tag <strong>@ugc.community</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold text-xs flex-shrink-0 mt-0.5">3</span>
            <span>We detect your mention and track milestones</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && !error && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-warm-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-2">
            No active jobs right now
          </h2>
          <p className="text-warm-gray-500">
            Check back soon — new content jobs are posted regularly.
          </p>
        </div>
      )}

      {/* Job cards */}
      {!isLoading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`bg-white rounded-[--radius-xl] border ${
                job.isFeatured ? "border-coral/30 ring-1 ring-coral/10" : "border-warm-gray-200"
              } overflow-hidden transition-all hover:shadow-sm`}
            >
              <button
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                className="w-full text-left p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {job.isFeatured && (
                        <span className="text-xs font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-warm-gray-900">
                        {job.title}
                      </h3>
                    </div>
                    <p className="text-sm text-warm-gray-500 line-clamp-2 mb-3">
                      {job.description}
                    </p>

                    {/* Hooks preview */}
                    {job.hooks && job.hooks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(job.hooks as string[]).slice(0, 3).map((hook, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs bg-warm-gray-100 text-warm-gray-700 px-2.5 py-1 rounded-full"
                          >
                            <Hash size={10} />
                            {hook.length > 40 ? hook.slice(0, 40) + "..." : hook}
                          </span>
                        ))}
                        {(job.hooks as string[]).length > 3 && (
                          <span className="text-xs text-warm-gray-400">
                            +{(job.hooks as string[]).length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {job.platforms && job.platforms.length > 0 && (
                      <div className="flex gap-1">
                        {job.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="text-xs bg-warm-gray-100 text-warm-gray-600 px-2 py-0.5 rounded-full capitalize"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    )}
                    {job.deadlineAt && (
                      <div className="flex items-center gap-1 text-xs text-warm-gray-400">
                        <Clock size={12} />
                        <span>
                          {new Date(job.deadlineAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {expandedJob === job.id && (
                <div className="border-t border-warm-gray-100">
                  <div className="px-6 pt-4 pb-2">
                    <div className="prose prose-sm max-w-none text-warm-gray-600">
                      <p>{job.description}</p>
                    </div>
                  </div>

                  {/* Hooks & Inspiration — fetches from job_hooks table */}
                  <JobHooksTable jobId={job.id} legacyHooks={job.hooks} />

                  {/* Meta info */}
                  <div className="px-6 pb-5 flex flex-wrap gap-4 text-xs text-warm-gray-400">
                    {job.compensationType && (
                      <span className="capitalize">
                        💰 {job.compensationType}
                        {job.compensationDetails && ` — ${job.compensationDetails}`}
                      </span>
                    )}
                    {job.niches && job.niches.length > 0 && (
                      <span>🎯 {job.niches.join(", ")}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
