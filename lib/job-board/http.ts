export async function readBody(request: Request, max = 128_000): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body");
  let size = 0, text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > max) { await reader.cancel(); throw new Error("Request too large"); }
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const trusted = new Set([new URL(request.url).origin]);
  // Next may use an internal localhost URL while the browser uses the
  // configured app host. Accept only that explicit canonical origin too.
  for (const value of [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    if (value) { try { trusted.add(new URL(value).origin); } catch { /* Ignore invalid configuration. */ } }
  }
  return trusted.has(origin);
}
