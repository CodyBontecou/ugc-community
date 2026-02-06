"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Loader2, Hash, Clock, Eye } from "lucide-react";

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
  };
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const [jobData, setJobData] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  const job = jobData.job;
  const hooks = (job.hooks || []) as string[];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back to Jobs
      </Link>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-warm-gray-100">
          <div className="flex items-center gap-2 mb-3">
            {job.isFeatured && (
              <span className="text-xs font-medium text-coral bg-coral/10 px-2.5 py-0.5 rounded-full">
                Featured
              </span>
            )}
            {job.platforms && job.platforms.length > 0 &&
              job.platforms.map((platform) => (
                <span
                  key={platform}
                  className="text-xs bg-warm-gray-100 text-warm-gray-600 px-2 py-0.5 rounded-full capitalize"
                >
                  {platform}
                </span>
              ))}
          </div>
          <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-3">
            {job.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-warm-gray-500">
            {job.compensationType && (
              <span className="capitalize">
                💰 {job.compensationType}
                {job.compensationDetails && ` — ${job.compensationDetails}`}
              </span>
            )}
            {job.deadlineAt && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Deadline: {new Date(job.deadlineAt).toLocaleDateString()}
              </span>
            )}
            {job.niches && job.niches.length > 0 && (
              <span>🎯 {job.niches.join(", ")}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="p-8 border-b border-warm-gray-100">
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-3">
            Description
          </h2>
          <div className="prose prose-sm max-w-none text-warm-gray-600 whitespace-pre-wrap">
            {job.description}
          </div>
        </div>

        {/* Hooks */}
        {hooks.length > 0 && (
          <div className="p-8 border-b border-warm-gray-100">
            <h2 className="text-lg font-semibold text-warm-gray-900 mb-1 flex items-center gap-2">
              <Hash size={18} className="text-coral" />
              Hooks to Use
            </h2>
            <p className="text-sm text-warm-gray-500 mb-4">
              Use these hooks in your TikTok content. We'll automatically detect and credit your posts.
            </p>
            <div className="space-y-3">
              {hooks.map((hook, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-gradient-to-r from-coral/5 to-rose/5 border border-coral/10 rounded-[--radius-lg] px-5 py-4"
                >
                  <span className="text-coral font-bold text-sm mt-0.5">
                    {i + 1}.
                  </span>
                  <span className="text-warm-gray-800 font-medium">
                    &ldquo;{hook}&rdquo;
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="p-8 bg-warm-gray-50">
          <div className="text-center">
            <p className="text-warm-gray-600 mb-2">
              Create content using the hooks above and post to TikTok.
            </p>
            <p className="text-sm text-warm-gray-400">
              Our system automatically detects your posts every 12 hours and tracks your milestones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
