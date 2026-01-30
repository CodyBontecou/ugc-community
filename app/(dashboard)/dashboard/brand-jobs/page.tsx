"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Eye,
  Users,
  Pause,
  Play,
  XCircle,
} from "lucide-react";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import {
  JOB_STATUS_LABELS,
  COMPENSATION_TYPE_LABELS,
  type JobStatus,
  type CompensationType,
} from "@/lib/jobs/constants";

interface BrandJob {
  id: string;
  title: string;
  description: string;
  compensationType: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  publishedAt: string | null;
  applicationCount?: number;
}

interface JobLimits {
  used: number;
  max: number;
  remaining: number;
}

type StatusFilter = "" | "draft" | "pending_review" | "active" | "paused" | "closed";

export default function BrandJobsPage() {
  const [jobs, setJobs] = useState<BrandJob[]>([]);
  const [limits, setLimits] = useState<JobLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/brand/jobs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setLimits(data.limits || null);
      } else if (response.status === 403) {
        setError("Brand access required");
      } else {
        setError("Failed to load jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    setActionInProgress(jobId);
    try {
      const response = await fetch(`/api/brand/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchJobs();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update job status");
      }
    } catch (err) {
      console.error("Error updating job:", err);
      alert("Failed to update job");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    setActionInProgress(jobId);
    try {
      const response = await fetch(`/api/brand/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        // Refresh to update limits
        fetchJobs();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete job");
      }
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Failed to delete job");
    } finally {
      setActionInProgress(null);
    }
  };

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: "", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "pending_review", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "closed", label: "Closed" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            My Job Listings
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
          My Job Listings
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const canCreateJob = limits && limits.remaining > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            My Job Listings
          </h1>
          {limits && (
            <p className="text-sm text-warm-gray-500 mt-1">
              {limits.used} of {limits.max} jobs used
            </p>
          )}
        </div>
        {canCreateJob ? (
          <Link
            href="/dashboard/brand-jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white font-medium rounded-[--radius-md] hover:bg-coral/90 transition-colors"
          >
            <Plus size={18} />
            Post New Job
          </Link>
        ) : (
          <div className="text-sm text-warm-gray-500 bg-warm-gray-100 px-4 py-2 rounded-[--radius-md]">
            Job limit reached ({limits?.max} max)
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-warm-gray-600">Filter:</span>
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              statusFilter === filter.value
                ? "bg-warm-gray-900 text-white"
                : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-warm-gray-500">
              {statusFilter ? `No ${JOB_STATUS_LABELS[statusFilter as JobStatus] || statusFilter} jobs` : "No jobs yet"}
            </p>
            {!statusFilter && canCreateJob && (
              <Link
                href="/dashboard/brand-jobs/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-coral text-white font-medium rounded-[--radius-md] hover:bg-coral/90 transition-colors"
              >
                <Plus size={18} />
                Post Your First Job
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-warm-gray-50 border-b border-warm-gray-200">
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Job
                  </th>
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Compensation
                  </th>
                  <th className="text-center text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Views
                  </th>
                  <th className="text-center text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Applications
                  </th>
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Created
                  </th>
                  <th className="text-right text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-warm-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/dashboard/brand-jobs/${job.id}`}
                          className="font-medium text-warm-gray-900 hover:text-coral transition-colors"
                        >
                          {job.title}
                        </Link>
                        <span className="text-sm text-warm-gray-500 line-clamp-1">
                          {job.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <JobStatusBadge status={job.status as JobStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-warm-gray-600">
                        {COMPENSATION_TYPE_LABELS[job.compensationType as CompensationType] ||
                          job.compensationType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-warm-gray-600">
                        <Eye size={14} />
                        {job.viewCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/dashboard/brand-jobs/${job.id}?tab=applications`}
                        className="inline-flex items-center gap-1 text-sm text-warm-gray-600 hover:text-coral transition-colors"
                      >
                        <Users size={14} />
                        {job.applicationCount || 0}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-warm-gray-500">
                        {formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit - only for draft/pending */}
                        {["draft", "pending_review"].includes(job.status) && (
                          <Link
                            href={`/dashboard/brand-jobs/${job.id}`}
                            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {/* Pause - only for active jobs */}
                        {job.status === "active" && (
                          <button
                            onClick={() => handleStatusChange(job.id, "paused")}
                            disabled={actionInProgress === job.id}
                            className="p-2 text-warm-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-[--radius-md] transition-colors disabled:opacity-50"
                            title="Pause"
                          >
                            {actionInProgress === job.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Pause size={16} />
                            )}
                          </button>
                        )}
                        {/* Close - for active/paused jobs */}
                        {["active", "paused"].includes(job.status) && (
                          <button
                            onClick={() => handleStatusChange(job.id, "closed")}
                            disabled={actionInProgress === job.id}
                            className="p-2 text-warm-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[--radius-md] transition-colors disabled:opacity-50"
                            title="Close"
                          >
                            {actionInProgress === job.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <XCircle size={16} />
                            )}
                          </button>
                        )}
                        {/* Delete - only for draft/pending */}
                        {["draft", "pending_review"].includes(job.status) && (
                          <button
                            onClick={() => handleDelete(job.id)}
                            disabled={actionInProgress === job.id}
                            className="p-2 text-warm-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[--radius-md] transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {actionInProgress === job.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
