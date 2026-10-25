import { serverCard } from "@/lib/public-api/mcp";
export function GET() { return Response.json(serverCard, { headers: { "Cache-Control": "public, max-age=3600" } }); }
