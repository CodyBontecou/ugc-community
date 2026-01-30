// Re-export niches from directory constants
export { NICHES, NICHE_LABELS, type Niche } from "../directory/constants";

// Job statuses
export const JOB_STATUSES = ["draft", "active", "paused", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
};

// Compensation types
export const COMPENSATION_TYPES = ["paid", "product", "hybrid", "exposure"] as const;
export type CompensationType = (typeof COMPENSATION_TYPES)[number];

export const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  paid: "Paid",
  product: "Product Only",
  hybrid: "Paid + Product",
  exposure: "Exposure",
};

export const COMPENSATION_TYPE_DESCRIPTIONS: Record<CompensationType, string> = {
  paid: "Monetary compensation for content",
  product: "Free products in exchange for content",
  hybrid: "Both monetary compensation and free products",
  exposure: "Exposure and portfolio building opportunity",
};

// Platforms
export const PLATFORMS = ["tiktok", "instagram", "youtube"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

// Application statuses
export const APPLICATION_STATUSES = ["interested", "applied", "accepted", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  interested: "Interested",
  applied: "Applied",
  accepted: "Accepted",
  rejected: "Rejected",
};

// Default pagination
export const DEFAULT_JOBS_PAGE_SIZE = 20;
