import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleJobsMcp } from "@/lib/public-api/mcp";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  return handleJobsMcp(request, env);
}
export { handle as GET, handle as POST, handle as DELETE };
