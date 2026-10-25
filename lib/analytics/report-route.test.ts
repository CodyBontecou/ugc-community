import assert from "node:assert/strict";
import { mock, test } from "node:test";
let admin = false, reads = 0, fail = false;
mock.module("../../lib/job-board/access.ts", { namedExports: { boardAdmin: async () => admin ? { user: { email: "admin@example.com" } } : null } });
mock.module("../../lib/analytics/server.ts", { namedExports: { analyticsDatabase: async () => { reads++; if (fail) throw new Error("private database error"); return {}; } } });
mock.module("../../lib/analytics/report.ts", { namedExports: { analyticsReport: async (_db: unknown, days: number) => ({ days, current: { sessions: 17 } }), reportCsv: () => '"Section","Label","Events","Sessions"' } });
const { GET } = await import("../../app/api/analytics/report/route");
test("report and CSV exports reject non-admins before reading analytics", async () => {
  for (const format of ["", "&format=csv"]) {
    const response = await GET(new Request(`https://ugc.community/api/analytics/report?days=7${format}`));
    assert.equal(response.status, 401); assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
  assert.equal(reads, 0);
});
test("authorized report honors bounded periods and marks exports private", async () => {
  admin = true;
  const response = await GET(new Request("https://ugc.community/api/analytics/report?days=9999"));
  assert.equal(response.status, 200); assert.equal((await response.json()).days, 30);
  assert.equal(response.headers.get("vary"), "Cookie");
  const csv = await GET(new Request("https://ugc.community/api/analytics/report?days=7&format=csv"));
  assert.equal(csv.status, 200); assert.equal(csv.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.match(csv.headers.get("content-disposition") || "", /attachment/);
});
test("unavailable analytics returns a private 503 without database details", async () => {
  fail = true;
  const response = await GET(new Request("https://ugc.community/api/analytics/report"));
  assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /private database error/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
