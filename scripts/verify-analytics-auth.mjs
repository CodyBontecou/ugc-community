import assert from "node:assert/strict";
const base = new URL(process.argv[2] || "https://ugc.community");
async function check(path, status, init = {}) {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init });
  assert.equal(response.status, status, `${path}: expected ${status}, received ${response.status}`);
  console.log(`PASS ${path}: ${status}`);
  return response;
}
for (const path of ["/api/analytics/postings", "/api/analytics/report"]) {
  const response = await check(path, 401);
  assert.match(response.headers.get("cache-control") || "", /private.*no-store/);
}
for (const path of ["/dashboard/postings", "/dashboard/admin/analytics"]) {
  const response = await check(path, 307);
  assert.equal(new URL(response.headers.get("location"), base).pathname, "/sign-in");
}
await check("/api/analytics/events", 403, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://example.com" }, body: "{}" });
for (const headers of [{ DNT: "1" }, { "Sec-GPC": "1" }]) {
  await check("/api/analytics/events", 204, { method: "POST", headers: { "Content-Type": "application/json", Origin: base.origin, ...headers }, body: "{}" });
}
