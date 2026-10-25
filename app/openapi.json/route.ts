import { openapi } from "@/lib/public-api/openapi";
export function GET() {
  return Response.json(openapi, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
