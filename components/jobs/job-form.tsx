"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, Lightbulb } from "lucide-react";
import {
  NICHES,
  NICHE_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
  COMPENSATION_TYPES,
  COMPENSATION_TYPE_LABELS,
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type Niche,
  type Platform,
  type CompensationType,
  type JobStatus,
} from "@/lib/jobs/constants";

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

interface JobFormProps {
  initialData?: Partial<JobFormData>;
  jobId?: string;
  mode: "create" | "edit";
  context?: "admin" | "brand";
  onSuccess?: () => void;
}

export function JobForm({ initialData, jobId, mode, context = "admin", onSuccess }: JobFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBrandContext = context === "brand";

  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    hooks: initialData?.hooks || [],
    compensationType: initialData?.compensationType || "paid",
    compensationDetails: initialData?.compensationDetails || "",
    niches: initialData?.niches || [],
    platforms: initialData?.platforms || [],
    status: initialData?.status || "draft",
    isFeatured: initialData?.isFeatured || false,
    deadlineAt: initialData?.deadlineAt || "",
  });

  const [newHook, setNewHook] = useState("");

  const handleSubmit = async (e: React.FormEvent, submitForReview = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const baseUrl = isBrandContext ? "/api/brand/jobs" : "/api/admin/jobs";
      const url = mode === "create" ? baseUrl : `${baseUrl}/${jobId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      // For brand context, set status based on whether they're submitting for review
      let dataToSend = {
        ...formData,
        deadlineAt: formData.deadlineAt || null,
      };

      if (isBrandContext && submitForReview) {
        dataToSend = {
          ...dataToSend,
          status: "pending_review" as JobStatus,
        };
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          const redirectUrl = isBrandContext ? "/dashboard/brand-jobs" : "/dashboard/admin/jobs";
          router.push(redirectUrl);
          router.refresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save job");
      }
    } catch (err) {
      console.error("Error saving job:", err);
      setError("Failed to save job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setError(null);

    try {
      const baseUrl = isBrandContext ? "/api/brand/jobs" : "/api/admin/jobs";
      const url = mode === "create" ? baseUrl : `${baseUrl}/${jobId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "draft",
          deadlineAt: formData.deadlineAt || null,
        }),
      });

      if (response.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          const redirectUrl = isBrandContext ? "/dashboard/brand-jobs" : "/dashboard/admin/jobs";
          router.push(redirectUrl);
          router.refresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save draft");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setError("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const addHook = () => {
    if (newHook.trim()) {
      setFormData((prev) => ({
        ...prev,
        hooks: [...prev.hooks, newHook.trim()],
      }));
      setNewHook("");
    }
  };

  const removeHook = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      hooks: prev.hooks.filter((_, i) => i !== index),
    }));
  };

  const toggleNiche = (niche: Niche) => {
    setFormData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
  };

  const togglePlatform = (platform: Platform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          placeholder="e.g., TikTok Creator for Skincare Brand"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          required
          rows={6}
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          placeholder="Describe the opportunity, requirements, and what you're looking for..."
        />
      </div>

      {/* Video Hooks */}
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-500" />
            Video Ideas / Hooks
          </span>
        </label>
        <p className="text-xs text-warm-gray-500 mb-2">
          Add specific video ideas or hooks to inspire creators
        </p>
        <div className="space-y-2">
          {formData.hooks.map((hook, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-warm-gray-50 px-3 py-2 rounded-[--radius-md]"
            >
              <span className="text-sm text-warm-gray-700 flex-1">{hook}</span>
              <button
                type="button"
                onClick={() => removeHook(index)}
                className="text-warm-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newHook}
              onChange={(e) => setNewHook(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHook())}
              className="flex-1 px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              placeholder="Add a video idea..."
            />
            <button
              type="button"
              onClick={addHook}
              className="px-4 py-2 bg-warm-gray-100 text-warm-gray-700 rounded-[--radius-md] hover:bg-warm-gray-200 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-2">
            Compensation Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.compensationType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                compensationType: e.target.value as CompensationType,
              }))
            }
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          >
            {COMPENSATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {COMPENSATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-2">
            Compensation Details
          </label>
          <input
            type="text"
            value={formData.compensationDetails}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                compensationDetails: e.target.value,
              }))
            }
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            placeholder="e.g., $200-$500 per video"
          />
        </div>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-2">
          Platforms
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                formData.platforms.includes(platform)
                  ? "bg-coral text-white"
                  : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
              }`}
            >
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      {/* Niches */}
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-2">
          Niches
        </label>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((niche) => (
            <button
              key={niche}
              type="button"
              onClick={() => toggleNiche(niche)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                formData.niches.includes(niche)
                  ? "bg-lavender text-white"
                  : "bg-warm-gray-50 text-warm-gray-600 hover:bg-warm-gray-100"
              }`}
            >
              {NICHE_LABELS[niche]}
            </button>
          ))}
        </div>
      </div>

      {/* Status and Options */}
      <div className={`grid grid-cols-1 ${isBrandContext ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4`}>
        {!isBrandContext && (
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as JobStatus,
                }))
              }
              className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
            >
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {JOB_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-2">
            Deadline
          </label>
          <input
            type="date"
            value={formData.deadlineAt}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, deadlineAt: e.target.value }))
            }
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          />
        </div>
        {!isBrandContext && (
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                }
                className="w-4 h-4 rounded border-warm-gray-300 text-coral focus:ring-coral/20"
              />
              <span className="text-sm text-warm-gray-700">Featured job</span>
            </label>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4 border-t border-warm-gray-200">
        {isBrandContext ? (
          <>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isSavingDraft}
              className="px-6 py-2 bg-warm-gray-100 text-warm-gray-700 font-medium rounded-[--radius-md] hover:bg-warm-gray-200 transition-colors disabled:opacity-50"
            >
              {isSavingDraft ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Draft"
              )}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              onClick={(e) => handleSubmit(e, true)}
              className="px-6 py-2 bg-coral text-white font-medium rounded-[--radius-md] hover:bg-coral/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit for Review"
              )}
            </button>
          </>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-coral text-white font-medium rounded-[--radius-md] hover:bg-coral/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </span>
            ) : mode === "create" ? (
              "Create Job"
            ) : (
              "Save Changes"
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push(isBrandContext ? "/dashboard/brand-jobs" : "/dashboard/admin/jobs")}
          className="px-6 py-2 text-warm-gray-600 hover:text-warm-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
