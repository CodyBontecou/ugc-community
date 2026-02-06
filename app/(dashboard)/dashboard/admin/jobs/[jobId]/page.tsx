"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";
import { JobForm } from "@/components/jobs/job-form";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobStatus, Niche, CompensationType, Platform } from "@/lib/jobs/constants";

interface JobData {
  job: {
    id: string;
    title: string;
    description: string;
    hooks: string[] | null;
    compensationType: string;
    compensationDetails: string | null;
    niches: string[] | null;
    platforms: string[] | null;
    status: string;
    isFeatured: boolean;
    deadlineAt: string | null;
    viewCount: number;
    createdAt: string;
    publishedAt: string | null;
  };
}

export default function EditJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/admin/jobs/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setJobData(data);
        } else if (response.status === 404) {
          setError("Job not found");
        } else {
          setError("Failed to load job");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("Failed to load job");
      } finally {
        setIsLoading(false);
      }
    }

    fetchJob();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard/admin/jobs"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error || "Job not found"}</p>
        </div>
      </div>
    );
  }

  const { job } = jobData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/admin/jobs"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            {job.title}
          </h1>
          <JobStatusBadge status={job.status as JobStatus} />
        </div>
        <p className="text-warm-gray-500">
          Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <JobForm
          mode="edit"
          jobId={jobId}
          initialData={{
            title: job.title,
            description: job.description,
            hooks: job.hooks || [],
            compensationType: job.compensationType as CompensationType,
            compensationDetails: job.compensationDetails || "",
            niches: (job.niches || []) as Niche[],
            platforms: (job.platforms || []) as Platform[],
            status: job.status as JobStatus,
            isFeatured: job.isFeatured,
            deadlineAt: job.deadlineAt
              ? new Date(job.deadlineAt).toISOString().split("T")[0]
              : "",
          }}
        />
      </div>
    </div>
  );
}
