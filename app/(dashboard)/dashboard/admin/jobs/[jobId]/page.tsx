"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, Users, ExternalLink } from "lucide-react";
import { JobForm } from "@/components/jobs/job-form";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobStatus, Niche, CompensationType, Platform } from "@/lib/jobs/constants";

interface Application {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
    subdomain: string | null;
    niches: string[] | null;
    tagline: string | null;
  };
}

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
    applicationCount: number;
  };
  applications: Application[];
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
  const [activeTab, setActiveTab] = useState<"edit" | "applications">("edit");

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

  const { job, applications } = jobData;

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

      {/* Tabs */}
      <div className="flex border-b border-warm-gray-200">
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "edit"
              ? "border-coral text-coral"
              : "border-transparent text-warm-gray-600 hover:text-warm-gray-900"
          }`}
        >
          Edit Job
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "applications"
              ? "border-coral text-coral"
              : "border-transparent text-warm-gray-600 hover:text-warm-gray-900"
          }`}
        >
          <Users size={16} />
          Applications ({applications.length})
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "edit" && (
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
      )}

      {activeTab === "applications" && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200">
          {applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-warm-gray-400" />
              </div>
              <p className="text-warm-gray-500">No applications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-gray-100">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="p-4 hover:bg-warm-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {application.creator.image ? (
                      <img
                        src={application.creator.image}
                        alt={application.creator.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center text-white font-medium">
                        {application.creator.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-warm-gray-900">
                          {application.creator.displayName ||
                            application.creator.name}
                        </p>
                        {application.creator.subdomain && (
                          <a
                            href={`https://${application.creator.subdomain}.ugc.community`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-warm-gray-400 hover:text-coral"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      {application.creator.tagline && (
                        <p className="text-sm text-warm-gray-500">
                          {application.creator.tagline}
                        </p>
                      )}
                      {application.note && (
                        <p className="text-sm text-warm-gray-600 mt-2 bg-warm-gray-50 p-2 rounded-[--radius-md]">
                          "{application.note}"
                        </p>
                      )}
                      <p className="text-xs text-warm-gray-400 mt-2">
                        Applied{" "}
                        {formatDistanceToNow(new Date(application.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
