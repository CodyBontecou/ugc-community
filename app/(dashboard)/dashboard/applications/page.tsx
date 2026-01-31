"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Loader2, Search, X } from "lucide-react";
import {
  ApplicationsTable,
  type ApplicationRow,
} from "@/components/jobs/applications-table";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/jobs/constants";

export default function CreatorApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">(
    ""
  );

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch("/api/applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      } else {
        setError("Failed to load applications");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Filter applications client-side
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (selectedStatus && app.status !== selectedStatus) {
        return false;
      }

      // Search filter (job title or brand name)
      if (search) {
        const searchLower = search.toLowerCase();
        const jobTitle = app.job.title.toLowerCase();
        const brandName = (
          app.job.brand?.displayName ||
          app.job.brand?.name ||
          ""
        ).toLowerCase();

        if (!jobTitle.includes(searchLower) && !brandName.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [applications, selectedStatus, search]);

  const hasFilters = search || selectedStatus;

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("");
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
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
          href="/dashboard"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          My Applications
        </h1>
        <p className="text-warm-gray-500">
          Track the status of jobs you&apos;ve expressed interest in
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-warm-gray-50 flex items-center justify-center mb-4">
            <Briefcase size={32} className="text-warm-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-warm-gray-900 mb-2">
            No applications yet
          </h3>
          <p className="text-warm-gray-600 mb-6">
            Browse available jobs and express your interest to start
            collaborating with brands.
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-coral hover:bg-coral/90 rounded-full transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <>
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
                  placeholder="Search by job title or brand..."
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
          <p className="text-sm text-warm-gray-500 mb-4">
            {filteredApplications.length} application
            {filteredApplications.length !== 1 ? "s" : ""}
            {hasFilters ? " found" : ""}
          </p>

          {/* Applications table */}
          <ApplicationsTable applications={filteredApplications} />
        </>
      )}
    </div>
  );
}
