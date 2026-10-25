import type { D1Database } from "@/cloudflare-env";
import { boardFilterSnapshot, listBoardJobs, type JobFilters } from "@/lib/job-board/search";
import { PAY_TYPES } from "@/lib/job-board/display";
export function feedFilters(params: Record<string, string | string[] | undefined>): JobFilters {
  const one = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  return { q: one("q").trim().slice(0, 100), source: ["external", "direct"].includes(one("source")) ? one("source") : "", pay: PAY_TYPES.some(type => type === one("pay")) ? one("pay") : "", page: Number(one("page")) || 1 };
}
export async function publicFeed(db: D1Database, filters: JobFilters) {
  const now = new Date().toISOString();
  const [result, snapshot] = await Promise.all([listBoardJobs(db, filters, now), boardFilterSnapshot(db, now)]);
  return { result, counts: snapshot.counts, validUntil: snapshot.validUntil };
}
