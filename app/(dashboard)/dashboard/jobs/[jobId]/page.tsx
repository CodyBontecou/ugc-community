"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import { JobDetail } from "@/components/jobs/job-detail";
import { useBrandUser } from "@/lib/hooks/use-brand-user";

interface JobDetailData {
  job: {
    id: string;
    title: string;
    description: string;
    hooks: string[] | null;
    compensationType: string;
    compensationDetails: string | null;
    niches: string[] | null;
    platforms: string[] | null;
    isFeatured: boolean;
    deadlineAt: string | null;
    viewCount: number;
    publishedAt: string | null;
    applicationCount: number;
    creatorApplication?: {
      status: string;
      appliedAt: string;
    } | null;
  };
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const { isBrand, isLoading: isBrandLoading } = useBrandUser();
  const [jobData, setJobData] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isBrandLoading) return;

    async function fetchJob() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
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
  }, [jobId, isBrandLoading]);

  const handleApply = () => {
    if (jobData) {
      setJobData({
        ...jobData,
        job: {
          ...jobData.job,
          creatorApplication: {
            status: "interested",
            appliedAt: new Date().toISOString(),
          },
          applicationCount: jobData.job.applicationCount + 1,
        },
      });
    }
  };

  // Loading state
  if (isBrandLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  // Brands don't have access
  if (isBrand) {
    return (
      <div className="max-w-4xl mx-auto">
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
          <p className="text-warm-gray-500">
            This page is only available for creator accounts.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !jobData) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>

        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-warm-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-2">
            {error || "Job not found"}
          </h2>
          <p className="text-warm-gray-500 mb-6">
            This job may have been removed or is no longer available.
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back to Jobs
      </Link>

      <JobDetail job={jobData.job} onApply={handleApply} />
    </div>
  );
}
