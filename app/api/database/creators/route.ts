import { canAccessCreatorDatabase, creatorBindings } from "@/lib/creator-database/access";
import { parseSearchFilters } from "@/lib/creator-database/filters";
import { searchCreators } from "@/lib/creator-database/search";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await canAccessCreatorDatabase()) return Response.json({ error: "Database access required" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  try {
    const { CREATOR_DATABASE } = await creatorBindings();
    const result = await searchCreators(CREATOR_DATABASE, parseSearchFilters(new URL(request.url).searchParams));
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Creator database temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
