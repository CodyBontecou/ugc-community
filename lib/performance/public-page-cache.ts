import { prefersMarkdown } from "../agent-content/negotiation";

export interface PublicRenderState { ready: boolean; validUntil: number }
export function publicRenderState(env: object): PublicRenderState | undefined {
  return (env as { __ugcPublicRender?: PublicRenderState }).__ugcPublicRender;
}
export interface PublicPageCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<unknown>;
}
interface Context { waitUntil(promise: Promise<unknown>): void }
interface VersionedEnv { CF_VERSION_METADATA?: { id: string } }
const MAX_AGE_MS = 30_000;

export function cacheablePublicRequest(request: Request): boolean {
  const url = new URL(request.url);
  const accept = request.headers.get("Accept") || "";
  return request.method === "GET" && ["/", "/jobs"].includes(url.pathname) && !url.search &&
    accept.includes("text/html") && !prefersMarkdown(accept) &&
    !["Cookie", "Authorization", "RSC", "Next-Router-State-Tree", "Next-Router-Prefetch", "Next-Router-Segment-Prefetch", "Next-Action", "Next-Url", "X-Nextjs-Data", "X-Middleware-Prefetch", "X-Middleware-Subrequest", "Range"].some(name => request.headers.has(name)) &&
    !/bot|crawler|spider|chatgpt-user|claude-web/i.test(request.headers.get("User-Agent") || "") &&
    !/no-cache|no-store|max-age\s*=\s*0/i.test(request.headers.get("Cache-Control") || "") &&
    !/no-cache/i.test(request.headers.get("Pragma") || "");
}

function delivered(response: Response, outcome: string): Response {
  const result = new Response(response.body, response);
  // Only the internal copy is shared. Browsers must revalidate fresh requests.
  result.headers.delete("X-Public-Valid-Until");
  result.headers.set("X-Public-Page-Cache", outcome);
  if (outcome !== "BYPASS") console.log(JSON.stringify({ event: "public_page_cache", outcome }));
  return result;
}

export async function publicPageResponse<E extends VersionedEnv>(
  request: Request, env: E, ctx: Context,
  render: (requestEnv: E & { __ugcPublicRender: PublicRenderState }) => Promise<Response>,
  cache?: PublicPageCache,
): Promise<Response> {
  const state: PublicRenderState = { ready: false, validUntil: 0 };
  const eligible = Boolean(cache && env.CF_VERSION_METADATA?.id && cacheablePublicRequest(request));
  const url = new URL(request.url);
  const key = new Request(`${url.origin}/__ugc_public_cache/${encodeURIComponent(env.CF_VERSION_METADATA?.id || "")}${url.pathname}`);
  if (eligible && cache) {
    try {
      const hit = await cache.match(key);
      if (hit && Number(hit.headers.get("X-Public-Valid-Until")) > Date.now()) return delivered(hit, "HIT");
    } catch { /* A cache failure must not take the job board offline. */ }
  }
  // Per-request metadata travels with OpenNext's request environment. It is
  // never stored globally or added to the platform's configured bindings.
  const response = await render({ ...env, __ugcPublicRender: state });
  if (eligible && cache && state.ready && response.status === 200 &&
    response.headers.get("Content-Type")?.startsWith("text/html") &&
    !response.headers.has("Set-Cookie") && !response.headers.has("Content-Encoding") &&
    (response.headers.get("Vary") || "").split(",").every(name => ["", "accept", "accept-encoding", "cookie", "authorization", "rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch"].includes(name.trim().toLowerCase()))) {
    const deadline = Math.min(Date.now() + MAX_AGE_MS, state.validUntil);
    const ttl = Math.floor((deadline - Date.now()) / 1000);
    if (ttl > 0) {
      const stored = new Response(response.clone().body, response);
      stored.headers.set("Cache-Control", `public, max-age=${ttl}`);
      stored.headers.set("X-Public-Valid-Until", String(deadline));
      ctx.waitUntil(cache.put(key, stored).catch(() => {}));
    }
  }
  return delivered(response, eligible ? "MISS" : "BYPASS");
}
