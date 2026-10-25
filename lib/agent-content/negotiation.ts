/** Prefer an explicitly requested Markdown representation, honoring q=0 and HTML. */
export function prefersMarkdown(accept: string | null): boolean {
  const types = (accept || "").split(",").map(part => {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    const quality = params.find(param => param.trim().startsWith("q="));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0 };
  });
  const markdown = Math.max(0, ...types.filter(item => item.type === "text/markdown").map(item => item.q));
  const html = Math.max(0, ...types.filter(item => item.type === "text/html").map(item => item.q));
  return markdown > 0 && markdown >= html;
}

export function varyAccept(headers: Headers): void {
  const values = (headers.get("Vary") || "").split(",").map(value => value.trim()).filter(Boolean);
  if (!values.some(value => value.toLowerCase() === "accept" || value === "*")) values.push("Accept");
  headers.set("Vary", values.join(", "));
}

/** Keep Next's real 404 status while offering agents a recoverable error. */
export function agentResponse(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  varyAccept(headers);
  if (response.status === 404 && prefersMarkdown(request.headers.get("Accept"))) {
    void response.body?.cancel();
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    for (const header of ["Content-Length", "Content-Encoding", "ETag"]) headers.delete(header);
    return new Response(request.method === "HEAD" ? null : "# Page not found\n\nThis URL does not exist on ugc.community. Browse [jobs](https://ugc.community/jobs), read the [agent guide](https://ugc.community/guide), or consult the [sitemap](https://ugc.community/sitemap.xml).\n", { status: 404, headers });
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
