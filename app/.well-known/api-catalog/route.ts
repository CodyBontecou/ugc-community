export function GET() {
  return Response.json({ linkset: [{ anchor: "https://ugc.community", item: [{ href: "https://ugc.community/openapi.json", type: "application/vnd.oai.openapi+json", title: "ugc.community public jobs API" }], "service-doc": [{ href: "https://ugc.community/docs", type: "text/html" }] }] }, { headers: { "Content-Type": "application/linkset+json", "Cache-Control": "public, max-age=3600" } });
}
