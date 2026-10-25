import type { SearchFilters } from "./search";

export function parseSearchFilters(params: URLSearchParams): SearchFilters {
  const platform = params.get("platform") || "";
  return {
    query: (params.get("q") || "").trim().slice(0, 100),
    platform: platform === "instagram" || platform === "tiktok" || platform === "youtube" ? platform : "",
    emailOnly: params.get("email") === "true",
    page: Math.max(1, Math.min(100_000, Math.floor(Number(params.get("page")) || 1))),
  };
}
