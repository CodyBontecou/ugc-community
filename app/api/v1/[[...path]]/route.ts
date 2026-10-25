import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handlePublicApi } from "@/lib/public-api/http";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  return handlePublicApi(request, env);
}
export { handle as GET, handle as HEAD, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
