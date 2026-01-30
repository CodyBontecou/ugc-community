"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import { JobTable, type JobRow } from "@/components/jobs/job-table";
import { JobFilters } from "@/components/jobs/job-filters";
import { useBrandUser } from "@/lib/hooks/use-brand-user";
import type { Platform, CompensationType } from "@/lib/jobs/constants";

export default function JobsPage() {
  const { isBrand, isLoading: isBrandLoading } = useBrandUser();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedCompensationType, setSelectedCompensationType] = useState<
    CompensationType | ""
  >("");

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedNiches.length) params.set("niches", selectedNiches.join(","));
      if (selectedPlatforms.length)
        params.set("platforms", selectedPlatforms.join(","));
      if (selectedCompensationType)
        params.set("compensationType", selectedCompensationType);

      const response = await fetch(`/api/jobs?${params.toString()}`);
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
  }, [search, selectedNiches, selectedPlatforms, selectedCompensationType]);

  useEffect(() => {
    if (!isBrandLoading) {
      fetchJobs();
    }
  }, [isBrandLoading, fetchJobs]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleClearFilters = () => {
    setSearch("");
    setSelectedNiches([]);
    setSelectedPlatforms([]);
    setSelectedCompensationType("");
  };

  const handleApply = (jobId: string) => {
    // Update local state to reflect the application
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              creatorApplication: {
                status: "interested",
                appliedAt: new Date().toISOString(),
              },
            }
          : job
      )
    );
  };

  // Loading state
  if (isBrandLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  // Brands don't have access to jobs directory
  if (isBrand) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-warm-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-2">
            Creator-Only Feature
          </h2>
          <p className="text-warm-gray-500 mb-6">
            The jobs directory is only available for creator accounts.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Return to Dashboard
          </Link>
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
          Content Jobs
        </h1>
        <p className="text-warm-gray-500">
          Browse and apply to content creation opportunities from brands and ugc.community
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-4 mb-6">
        <JobFilters
          search={search}
          onSearchChange={setSearch}
          selectedNiches={selectedNiches}
          onNichesChange={setSelectedNiches}
          selectedPlatforms={selectedPlatforms}
          onPlatformsChange={setSelectedPlatforms}
          selectedCompensationType={selectedCompensationType}
          onCompensationTypeChange={setSelectedCompensationType}
          onClear={handleClearFilters}
        />
      </div>

      {/* Job count */}
      {!isLoading && (
        <p className="text-sm text-warm-gray-500 mb-4">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Jobs table */}
      <JobTable jobs={jobs} isLoading={isLoading} onApply={handleApply} />
    </div>
  );
}
