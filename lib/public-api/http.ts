import type { D1Database } from "@/cloudflare-env";
import { getPublicJob, searchPublicJobs, searchSchema } from "./jobs";

export const publicHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Expose-Headers": "Retry-After, Link, RateLimit-Policy",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "RateLimit-Policy": '"public";q=120;w=60',
  Link: '<https://ugc.community/openapi.json>; rel="service-desc", <https://ugc.community/docs>; rel="service-doc", <https://ugc.community/docs/deprecation>; rel="deprecation"; type="text/html"',
};
export function problem(status: number, code: string, detail: string, resolution: string, extraHeaders: HeadersInit = {}) {
  return Response.json({ type: `https://ugc.community/docs#${code}`, title: code.replace(/_/g, " "), status, code, detail, resolution }, { status, headers: { ...publicHeaders, "Content-Type": "application/problem+json", ...extraHeaders } });
}
export const catalog = {
  name: "ugc.community public jobs API", version: "1.0.0", authentication: "none", readOnly: true,
  documentation: "https://ugc.community/docs", openapi: "https://ugc.community/openapi.json", mcp: "https://ugc.community/mcp",
  endpoints: [{ method: "GET", url: "https://ugc.community/api/v1/jobs", description: "Search published, current UGC jobs." }, { method: "GET", url: "https://ugc.community/api/v1/jobs/{id}", description: "Read a published, current job by ID." }],
};
export interface PublicApiBindings { JOB_BOARD: D1Database; PUBLIC_API_RATE_LIMITER: CloudflareEnv["PUBLIC_API_RATE_LIMITER"] }

export async function limitPublicRequest(request: Request, env: Pick<PublicApiBindings, "PUBLIC_API_RATE_LIMITER">): Promise<Response | null> {
  const { success } = await env.PUBLIC_API_RATE_LIMITER.limit({ key: `public:${request.headers.get("CF-Connecting-IP") || "local"}` });
  return success ? null : problem(429, "rate_limit_exceeded", "The public interface request limit was reached.", "Wait 60 seconds before retrying. Limits apply per client IP and Cloudflare location.", { "Retry-After": "60" });
}

export async function handlePublicApi(request: Request, env: PublicApiBindings): Promise<Response> {
  const respond = async (): Promise<Response> => {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: publicHeaders });
    if (!["GET", "HEAD"].includes(request.method)) return problem(405, "method_not_allowed", "This API only reads public job listings.", "Use GET. No write operations are available.", { Allow: "GET, HEAD, OPTIONS" });
    try {
      const limited = await limitPublicRequest(request, env);
      if (limited) return limited;
      const url = new URL(request.url);
      if (["/api", "/api/", "/api/v1", "/api/v1/"].includes(url.pathname)) return Response.json(catalog, { headers: publicHeaders });
      if (url.pathname === "/api/v1/jobs") {
        const raw = Object.fromEntries(url.searchParams);
        const parsed = searchSchema.safeParse({ ...raw, ...(raw.page !== undefined ? { page: Number(raw.page) } : {}) });
        if (!parsed.success) return problem(400, "invalid_parameters", parsed.error.issues.map(issue => `${issue.path.join(".") || "query"}: ${issue.message}`).join("; "), "Use the parameters and enum values in /openapi.json.");
        return Response.json(await searchPublicJobs(env.JOB_BOARD, parsed.data), { headers: publicHeaders });
      }
      const match = url.pathname.match(/^\/api\/v1\/jobs\/([A-Za-z0-9_-]{1,200})$/);
      if (match) {
        const job = await getPublicJob(env.JOB_BOARD, match[1]);
        if (!job) return problem(404, "job_not_found", "No current public job has this ID. Closed, expired, and unpublished jobs are not returned.", "Search /api/v1/jobs for current opportunities.");
        return Response.json(job, { headers: publicHeaders });
      }
      return problem(404, "route_not_found", "This public API route does not exist.", "Use /api/v1/jobs or consult /openapi.json.");
    } catch {
      return problem(503, "temporarily_unavailable", "The public job service is temporarily unavailable.", "Retry after 60 seconds. Do not interpret this response as an empty job feed.", { "Retry-After": "60" });
    }
  };
  const response = await respond();
  return request.method === "HEAD" ? new Response(null, { status: response.status, headers: response.headers }) : response;
}
