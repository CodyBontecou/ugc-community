import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { getPlatformProxy } from "wrangler";
import type { D1Database } from "@/cloudflare-env";

if (!process.argv.includes("--allow-production-fixture")) throw new Error("Explicit --allow-production-fixture is required; this creates and removes one synthetic event.");
const statePath = ".local/ai-discovery/qa-fixture.json";
const cleanupOnly = process.argv.includes("--cleanup-only");
let id = crypto.randomUUID(), sessionId = crypto.randomUUID();
if (cleanupOnly) {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.purpose, "ai-discovery-publication-check");
  for (const value of [state.id, state.sessionId]) assert.match(value, /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i);
  ({ id, sessionId } = state);
} else {
  await mkdir(".local/ai-discovery", { recursive: true });
  // Preserve exact fixture identities if a network failure prevents cleanup.
  await writeFile(statePath, JSON.stringify({ purpose: "ai-discovery-publication-check", id, sessionId }), { flag: "wx", mode: 0o600 });
}
const proxy = await getPlatformProxy<{ JOB_BOARD: D1Database }>({ configPath: ".wrangler/ai-acquisition-remote.jsonc" });
try {
  if (!cleanupOnly) {
    const payload = { consent: true, sessionId, source: "chatgpt", device: "desktop", events: [{ id, occurredAt: new Date().toISOString(), name: "page_view", path: "/tutorials/find-paid-ugc-jobs", properties: {} }] };
    const response = await fetch("https://ugc.community/api/analytics/events", { method: "POST", signal: AbortSignal.timeout(30_000), headers: { Origin: "https://ugc.community", "Content-Type": "application/json", Cookie: `ugc_analytics_session=${sessionId}` }, body: JSON.stringify(payload) });
    assert.equal(response.status, 204, "The deployed collector must accept a published tutorial landing");
    const row = await proxy.env.JOB_BOARD.prepare("SELECT path, source FROM analytics_events WHERE id=? AND session_id=?").bind(id, sessionId).first<{ path: string; source: string }>();
    assert.deepEqual(row, { path: "/tutorials/find-paid-ugc-jobs", source: "chatgpt" });
    console.log("PASS production tutorial page view and AI source are stored correctly");
  }
} finally {
  try {
    await proxy.env.JOB_BOARD.prepare("DELETE FROM analytics_events WHERE id=? AND session_id=?").bind(id, sessionId).run();
    const remaining = await proxy.env.JOB_BOARD.prepare("SELECT COUNT(*) AS n FROM analytics_events WHERE id=? AND session_id=?").bind(id, sessionId).first<{ n: number }>();
    assert.equal(remaining?.n, 0, "Synthetic fixture cleanup must be verified");
    await unlink(statePath);
    console.log("PASS the single synthetic event was removed; it is not organic referral traffic");
  } finally { await proxy.dispose(); }
}
