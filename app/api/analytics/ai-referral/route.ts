// Replaced by the consented, validated /api/analytics/events collector.
// Old cached clients must not write unconstrained paths into operational logs.
export async function POST() {
  return new Response(null, { status: 410, headers: { "Cache-Control": "no-store" } });
}
