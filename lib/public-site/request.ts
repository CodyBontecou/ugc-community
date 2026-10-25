import { prefersMarkdown } from "../agent-content/negotiation";
export function publicDocumentRequest(request: Request) {
 const url = new URL(request.url);
 return request.method === "GET" && ["/", "/jobs"].includes(url.pathname) && !url.searchParams.has("subdomain") && !prefersMarkdown(request.headers.get("Accept")) && !["RSC", "Next-Router-State-Tree", "Next-Action", "Next-Url", "Next-Router-Prefetch", "Next-Router-Segment-Prefetch", "X-Nextjs-Data"].some(h => request.headers.has(h));
}
