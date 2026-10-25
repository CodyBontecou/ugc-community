import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { privacySignal, sessionCookie, type EventProperties, type ServerEvent } from "./model";
import { writeServerEvent } from "./store";

export async function analyticsDatabase() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.JOB_BOARD) throw new Error("Analytics database unavailable");
  return env.JOB_BOARD;
}
export async function recordOutcome(request: Request, name: ServerEvent, path: string, properties: EventProperties = {}, identity?: string) {
  const sessionId = sessionCookie(request.headers);
  if (!sessionId || privacySignal(request.headers)) return;
  try {
    const { env, ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(writeServerEvent(env.JOB_BOARD, sessionId, name, path, properties, identity).catch(() => {
      console.warn("Analytics outcome could not be recorded");
    }));
  } catch {
    // A telemetry outage must never turn a completed application into a failed response.
    console.warn("Analytics outcome could not be recorded");
  }
}
