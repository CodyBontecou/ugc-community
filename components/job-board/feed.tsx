import { boardBindings, markPublicFeedReady } from "@/lib/job-board/bindings";
import { feedFilters, publicFeed } from "@/lib/public-site/feed";
import { JobFeedView } from "./feed-view";
export async function JobFeed({ params = {}, basePath = "/jobs" }: { params?: Record<string, string | string[] | undefined>; basePath?: "/" | "/jobs" }) {
  const filters = feedFilters(params);
  let data: Awaited<ReturnType<typeof publicFeed>> | null = null;
  try {
    data = await publicFeed((await boardBindings()).JOB_BOARD, filters);
    await markPublicFeedReady(data.validUntil);
  } catch { /* Show a truthful unavailable state. */ }
  return <JobFeedView filters={filters} result={data?.result || null} counts={data?.counts || null} basePath={basePath} />;
}
