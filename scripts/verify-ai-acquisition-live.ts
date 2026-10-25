import assert from "node:assert/strict";
import { getPlatformProxy } from "wrangler";
import type { D1Database } from "@/cloudflare-env";

if (!process.argv.includes("--allow-production-fixture")) throw new Error("Explicit --allow-production-fixture is required; this creates and removes one synthetic event.");
const id = crypto.randomUUID(), sessionId = crypto.randomUUID();
const proxy = await getPlatformProxy<{ JOB_BOARD: D1Database }>({ configPath: ".wrangler/ai-acquisition-remote.jsonc" });
try {
  const payload = { consent: true, sessionId, source: "chatgpt", device: "desktop", events: [{ id, occurredAt: new Date().toISOString(), name: "page_view", path: "/tutorials/find-paid-ugc-jobs", properties: {} }] };
  const response = await fetch("https://ugc.community/api/analytics/events", { method: "POST", signal: AbortSignal.timeout(30_000), headers: { Origin: "https://ugc.community", "Content-Type": "application/json", Cookie: `ugc_analytics_session=${sessionId}` }, body: JSON.stringify(payload) });
  assert.equal(response.status, 204, "The deployed collector must accept a published tutorial landing");
  const row = await proxy.env.JOB_BOARD.prepare("SELECT path, source FROM analytics_events WHERE id=? AND session_id=?").bind(id, sessionId).first<{ path: string; source: string }>();
  assert.deepEqual(row, { path: "/tutorials/find-paid-ugc-jobs", source: "chatgpt" });
  console.log("PASS production tutorial page view and AI source are stored correctly");
} finally {
  try {
    await proxy.env.JOB_BOARD.prepare("DELETE FROM analytics_events WHERE id=? AND session_id=?").bind(id, sessionId).run();
    const remaining = await proxy.env.JOB_BOARD.prepare("SELECT COUNT(*) AS n FROM analytics_events WHERE id=? AND session_id=?").bind(id, sessionId).first<{ n: number }>();
    assert.equal(remaining?.n, 0, "Synthetic fixture cleanup must be verified");
    console.log("PASS the single synthetic event was removed; it is not organic referral traffic");
  } finally { await proxy.dispose(); }
}
