import { getCloudflareContext } from "@opennextjs/cloudflare";
import { collectEvents } from "@/lib/analytics/ingest";
export async function POST(request: Request) {
  return collectEvents(request, async () => (await getCloudflareContext({ async: true })).env, process.env.NODE_ENV === "production");
}
