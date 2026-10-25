import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { publicRenderState } from "@/lib/performance/public-page-cache";

export async function boardBindings() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.JOB_BOARD || !env.SUBSCRAPE_EXPORTS) throw new Error("Job board bindings unavailable");
  return { JOB_BOARD: env.JOB_BOARD, SUBSCRAPE_EXPORTS: env.SUBSCRAPE_EXPORTS };
}

export async function markPublicFeedReady(validUntil: number) {
  const { env } = await getCloudflareContext({ async: true });
  const state = publicRenderState(env);
  if (state) { state.ready = true; state.validUntil = validUntil; }
}
