import type { D1Database } from "@/cloudflare-env";
import { batchSchema, privacySignal, sessionCookie } from "./model";
import { writeEvents } from "./store";
import { readBody, sameOrigin } from "../job-board/http";

export type AnalyticsBindings = { JOB_BOARD: D1Database; PUBLIC_API_RATE_LIMITER?: { limit(input: { key: string }): Promise<{ success: boolean }> } };
export async function collectEvents(request: Request, bindings: () => Promise<AnalyticsBindings>, production = true) {
  const headers = { "Cache-Control": "no-store" };
  if (!request.headers.get("origin") || !sameOrigin(request) || request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403, headers });
  if (privacySignal(request.headers) || /bot|spider|crawler|headless/i.test(request.headers.get("user-agent") || "")) return new Response(null, { status: 204, headers });
  let batch;
  try { batch = batchSchema.parse(await readBody(request, 24_000)); }
  catch { return Response.json({ error: "Invalid analytics batch" }, { status: 400, headers }); }
  if (sessionCookie(request.headers) !== batch.sessionId) return new Response(null, { status: 403, headers });
  try {
    const env = await bindings();
    // Do not persist or log the IP; the edge limiter uses it only as an opaque key.
    const key = request.headers.get("cf-connecting-ip");
    if (!env.PUBLIC_API_RATE_LIMITER || !key) {
      if (production) return new Response(null, { status: 503, headers });
    } else if (!(await env.PUBLIC_API_RATE_LIMITER.limit({ key: `analytics:${key}` })).success) {
      return new Response(null, { status: 429, headers: { ...headers, "Retry-After": "60" } });
    }
    await writeEvents(env.JOB_BOARD, batch);
    return new Response(null, { status: 204, headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
