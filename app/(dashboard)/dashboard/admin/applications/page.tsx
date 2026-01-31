"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Loader2,
  Search,
  X,
  ExternalLink,
  FileText,
} from "lucide-react";
import { ApplicationStatusBadge } from "@/components/jobs/ApplicationStatusBadge";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  COMPENSATION_TYPE_LABELS,
  type ApplicationStatus,
  type CompensationType,
} from "@/lib/jobs/constants";

interface Application {
  id: string;
  jobId: string;
  creatorId: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    description: string;
    compensationType: string;
    compensationDetails: string | null;
    status: string;
  };
  creator: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
    subdomain: string | null;
  };
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">(
    ""
  );

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedStatus) params.set("status", selectedStatus);

      const response = await fetch(`/api/admin/applications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setTotal(data.total || 0);
      } else if (response.status === 403) {
        setError("Admin access required");
      } else {
        setError("Failed to load applications");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const hasFilters = search || selectedStatus;

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("");
  };

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
          All Applications
        </h1>
        <p className="text-warm-gray-500">
          View and manage all job applications across the platform
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-4 mb-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400"
            />
            <input
              type="text"
              placeholder="Search by job title or creator name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedStatus("")}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedStatus === ""
                  ? "bg-coral text-white"
                  : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
              }`}
            >
              All
            </button>
            {APPLICATION_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedStatus === status
                    ? "bg-coral text-white"
                    : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
                }`}
              >
                {APPLICATION_STATUS_LABELS[status]}
              </button>
            ))}

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 text-xs font-medium rounded-full text-warm-gray-500 hover:bg-warm-gray-100 transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Application count */}
      {!isLoading && (
        <p className="text-sm text-warm-gray-500 mb-4">
          {total} application{total !== 1 ? "s" : ""}
          {hasFilters ? " found" : " total"}
        </p>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-warm-gray-100" />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 border-t border-warm-gray-100 flex items-center px-4"
              >
                <div className="h-4 bg-warm-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-warm-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-warm-gray-900 mb-2">
            No applications found
          </h3>
          <p className="text-warm-gray-500">
            {hasFilters
              ? "Try adjusting your filters."
              : "No applications have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-warm-gray-50 border-b border-warm-gray-200">
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Creator
                  </th>
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Job
                  </th>
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    Applied
                  </th>
                  <th className="text-right text-xs font-semibold text-warm-gray-600 uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-gray-100">
                {applications.map((application) => {
                  const creatorName =
                    application.creator.displayName ||
                    application.creator.name ||
                    "Unknown";

                  return (
                    <tr
                      key={application.id}
                      className="hover:bg-warm-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {application.creator.image ? (
                            <img
                              src={application.creator.image}
                              alt={creatorName}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white font-medium text-sm">
                              {creatorName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/dashboard/admin/users/${application.creatorId}`}
                              className="font-medium text-warm-gray-900 hover:text-coral transition-colors"
                            >
                              {creatorName}
                            </Link>
                            {application.creator.subdomain && (
                              <a
                                href={`https://${application.creator.subdomain}.ugc.community`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-warm-gray-400 hover:text-coral"
                              >
                                {application.creator.subdomain}.ugc.community
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/dashboard/admin/jobs/${application.jobId}`}
                            className="font-medium text-warm-gray-900 hover:text-coral transition-colors"
                          >
                            {application.job.title}
                          </Link>
                          <span className="inline-flex w-fit text-xs bg-warm-gray-100 text-warm-gray-600 px-2 py-0.5 rounded-full">
                            {COMPENSATION_TYPE_LABELS[
                              application.job.compensationType as CompensationType
                            ] || application.job.compensationType}
                          </span>
                          {/* Mobile: Show status inline */}
                          <div className="md:hidden mt-1">
                            <ApplicationStatusBadge
                              status={application.status as ApplicationStatus}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <ApplicationStatusBadge
                          status={application.status as ApplicationStatus}
                        />
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-warm-gray-600">
                          {formatDistanceToNow(new Date(application.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/admin/users/${application.creatorId}`}
                            className="p-2 text-warm-gray-400 hover:text-coral transition-colors"
                            title="View Creator"
                          >
                            <ExternalLink size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
