export async function POST() {
  return Response.json({ error: "The creator database has been retired. Visit /jobs for UGC opportunities." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
