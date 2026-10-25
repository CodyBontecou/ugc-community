import { canAccessCreatorDatabase, creatorBindings } from "@/lib/creator-database/access";
import { syncCreatorDatabase } from "@/lib/creator-database/sync";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!await canAccessCreatorDatabase()) return Response.json({ error: "Database access required" }, { status: 403 });
  try {
    const result = await syncCreatorDatabase(await creatorBindings());
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Import unavailable; scheduled sync will retry" }, { status: 503 });
  }
}
