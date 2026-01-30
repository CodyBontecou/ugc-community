"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { JobForm } from "@/components/jobs/job-form";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobStatus, Niche, Platform, CompensationType } from "@/lib/jobs/constants";
import { NICHE_LABELS } from "@/lib/jobs/constants";

interface JobFormData {
  title: string;
  description: string;
  hooks: string[];
  compensationType: CompensationType;
  compensationDetails: string;
  niches: Niche[];
  platforms: Platform[];
  status: JobStatus;
  isFeatured: boolean;
  deadlineAt: string;
}

interface Creator {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  subdomain: string | null;
  niches: string[] | null;
  tagline: string | null;
}

interface Application {
  id: string;
  jobId: string;
  creatorId: string;
  status: string;
  note: string | null;
  createdAt: string;
  creator: Creator;
}

interface JobData {
  job: {
    id: string;
    title: string;
    description: string;
    hooks: string[];
    compensationType: string;
    compensationDetails: string | null;
    niches: string[] | null;
    platforms: string[] | null;
    status: string;
    isFeatured: boolean;
    deadlineAt: string | null;
    viewCount: number;
    applicationCount: number;
    createdAt: string;
  };
  applications: Application[];
}

export default function BrandJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "applications" ? "applications" : "details";

  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "applications">(initialTab);

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/brand/jobs/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setJobData(data);
        } else if (response.status === 404) {
          setError("Job not found");
        } else if (response.status === 403) {
          setError("You don't have access to this job");
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/brand-jobs"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Job Details
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/brand-jobs"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Job Details
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error || "Job not found"}</p>
        </div>
      </div>
    );
  }

  const { job, applications } = jobData;
  const canEdit = ["draft", "pending_review"].includes(job.status);

  // Convert job data to form format
  const formData: Partial<JobFormData> = {
    title: job.title,
    description: job.description,
    hooks: job.hooks || [],
    compensationType: job.compensationType as CompensationType,
    compensationDetails: job.compensationDetails || "",
    niches: (job.niches || []) as Niche[],
    platforms: (job.platforms || []) as Platform[],
    status: job.status as JobStatus,
    isFeatured: job.isFeatured,
    deadlineAt: job.deadlineAt ? new Date(job.deadlineAt).toISOString().split("T")[0] : "",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/brand-jobs"
            className="p-2 text-warm-gray-400 hover:text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
              {job.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <JobStatusBadge status={job.status as JobStatus} />
              <span className="text-sm text-warm-gray-500">
                {job.viewCount} views · {job.applicationCount} applications
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status messages */}
      {job.status === "pending_review" && (
        <div className="bg-blue-50 border border-blue-200 rounded-[--radius-lg] p-4">
          <p className="text-sm text-blue-700">
            <strong>Pending Review:</strong> This job is awaiting admin approval. You can withdraw it to make edits.
          </p>
        </div>
      )}

      {job.status === "closed" && (
        <div className="bg-warm-gray-50 border border-warm-gray-200 rounded-[--radius-lg] p-4">
          <p className="text-sm text-warm-gray-600">
            This job has been closed and is no longer visible to creators.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-warm-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "details"
                ? "border-b-2 border-coral text-coral"
                : "text-warm-gray-500 hover:text-warm-gray-700"
            }`}
          >
            Job Details
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "applications"
                ? "border-b-2 border-coral text-coral"
                : "text-warm-gray-500 hover:text-warm-gray-700"
            }`}
          >
            Applications ({applications.length})
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "details" ? (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
          {canEdit ? (
            <JobForm
              mode="edit"
              context="brand"
              jobId={jobId}
              initialData={formData}
            />
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-warm-gray-500 mb-1">Description</h3>
                <p className="text-warm-gray-900 whitespace-pre-wrap">{job.description}</p>
              </div>
              {job.hooks && job.hooks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-warm-gray-500 mb-2">Video Ideas</h3>
                  <ul className="space-y-1">
                    {job.hooks.map((hook, i) => (
                      <li key={i} className="text-warm-gray-700 flex items-start gap-2">
                        <span className="text-coral">•</span>
                        {hook}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-warm-gray-500 mb-1">Compensation</h3>
                  <p className="text-warm-gray-900">
                    {job.compensationType}
                    {job.compensationDetails && ` - ${job.compensationDetails}`}
                  </p>
                </div>
                {job.deadlineAt && (
                  <div>
                    <h3 className="text-sm font-medium text-warm-gray-500 mb-1">Deadline</h3>
                    <p className="text-warm-gray-900">
                      {new Date(job.deadlineAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-sm text-warm-gray-500 pt-4 border-t border-warm-gray-200">
                This job cannot be edited because it is {job.status}. Close the job to stop accepting applications.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200">
          {applications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-warm-gray-500">No applications yet</p>
              {job.status === "active" && (
                <p className="text-sm text-warm-gray-400 mt-2">
                  Creators will appear here when they express interest in your job.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-warm-gray-100">
              {applications.map((application) => (
                <div key={application.id} className="p-4 hover:bg-warm-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Creator avatar */}
                    <div className="w-12 h-12 rounded-full bg-warm-gray-200 overflow-hidden flex-shrink-0">
                      {application.creator.image ? (
                        <Image
                          src={application.creator.image}
                          alt={application.creator.displayName || application.creator.name || "Creator"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-warm-gray-400 text-lg font-medium">
                          {(application.creator.displayName || application.creator.name || "C")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Creator info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-warm-gray-900">
                          {application.creator.displayName || application.creator.name || "Creator"}
                        </h3>
                        {application.creator.subdomain && (
                          <a
                            href={`https://${application.creator.subdomain}.ugc.community`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-coral hover:underline"
                          >
                            View Portfolio
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      {application.creator.tagline && (
                        <p className="text-sm text-warm-gray-600 mt-0.5">
                          {application.creator.tagline}
                        </p>
                      )}
                      {application.creator.niches && application.creator.niches.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {application.creator.niches.slice(0, 3).map((niche) => (
                            <span
                              key={niche}
                              className="px-2 py-0.5 text-xs bg-lavender/10 text-lavender rounded-full"
                            >
                              {NICHE_LABELS[niche as Niche] || niche}
                            </span>
                          ))}
                          {application.creator.niches.length > 3 && (
                            <span className="text-xs text-warm-gray-400">
                              +{application.creator.niches.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      {application.note && (
                        <div className="mt-2 p-2 bg-warm-gray-50 rounded-[--radius-md]">
                          <p className="text-sm text-warm-gray-700">{application.note}</p>
                        </div>
                      )}
                      <p className="text-xs text-warm-gray-400 mt-2">
                        Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
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
