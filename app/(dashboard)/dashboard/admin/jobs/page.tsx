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
} from "lucide-react";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  COMPENSATION_TYPE_LABELS,
  type JobStatus,
  type CompensationType,
} from "@/lib/jobs/constants";

interface AdminJob {
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

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/jobs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else if (response.status === 403) {
        setError("Admin access required");
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

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    setDeletingId(jobId);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      } else {
        alert("Failed to delete job");
      }
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Content Jobs
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
          Content Jobs
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Content Jobs
        </h1>
        <Link
          href="/dashboard/admin/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white font-medium rounded-[--radius-md] hover:bg-coral/90 transition-colors"
        >
          <Plus size={18} />
          New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-warm-gray-600">Filter:</span>
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            statusFilter === ""
              ? "bg-warm-gray-900 text-white"
              : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
          }`}
        >
          All
        </button>
        {JOB_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              statusFilter === status
                ? "bg-warm-gray-900 text-white"
                : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
            }`}
          >
            {JOB_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-warm-gray-500">No jobs found</p>
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
                        <span className="font-medium text-warm-gray-900 flex items-center gap-2">
                          {job.title}
                          {job.isFeatured && (
                            <span className="text-xs bg-coral/10 text-coral px-2 py-0.5 rounded-full">
                              Featured
                            </span>
                          )}
                        </span>
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
                      <span className="inline-flex items-center gap-1 text-sm text-warm-gray-600">
                        <Users size={14} />
                        {job.applicationCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-warm-gray-500">
                        {formatDistanceToNow(new Date(job.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/jobs/${job.id}`}
                          className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={deletingId === job.id}
                          className="p-2 text-warm-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[--radius-md] transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === job.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
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
