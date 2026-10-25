import { test, mock } from "node:test";
import assert from "node:assert/strict";
let account: string | null = null, blocked = false, reads = 0, broken = false;
const queried: { userId: string; jobId?: string | null }[] = [];
class PosterAccessError extends Error { constructor(message: string, public status: number) { super(message); } }
class PostingNotFound extends Error {}
mock.module("../../lib/analytics/poster-access.ts", { namedExports: { PosterAccessError, posterSession: async () => { if (!account) throw new PosterAccessError("Sign in", 401); if (blocked) throw new PosterAccessError("Blocked", 403); return { id: account }; } } });
mock.module("../../lib/analytics/server.ts", { namedExports: { analyticsDatabase: async () => { reads++; if (broken) throw new Error("private database detail"); return {}; } } });
mock.module("../../lib/analytics/postings.ts", { namedExports: { PostingNotFound, postingPage: () => 1, postingReport: async (_db: unknown, userId: string, options: { jobId?: string | null }) => { queried.push({ userId, jobId: options.jobId }); if (options.jobId === "someone-elses-job") throw new PostingNotFound(); return { jobs: [], totalJobs: 0 }; } } });
const { GET } = await import("../../app/api/analytics/postings/route");
test("anonymous and suspended accounts cannot read or export analytics", async () => {
  assert.equal((await GET(new Request("https://ugc.community/api/analytics/postings"))).status, 401);
  account = "alice"; blocked = true;
  assert.equal((await GET(new Request("https://ugc.community/api/analytics/postings"))).status, 403);
  assert.equal(reads, 0); blocked = false;
});
test("scope always comes from the session, ignoring supplied account IDs", async () => {
  const result = await GET(new Request("https://ugc.community/api/analytics/postings?userId=bob&owner=bob"));
  assert.equal(result.status, 200); assert.equal(queried.at(-1)?.userId, "alice");
  assert.equal(result.headers.get("cache-control"), "private, no-store"); assert.equal(result.headers.get("vary"), "Cookie");
});
test("unauthorized and nonexistent listing IDs return the same generic 404", async () => {
  const result = await GET(new Request("https://ugc.community/api/analytics/postings?job=someone-elses-job"));
  assert.equal(result.status, 404); assert.deepEqual(await result.json(), { error: "Posting not found" });
  const oversized = await GET(new Request(`https://ugc.community/api/analytics/postings?job=${"x".repeat(101)}`));
  assert.equal(oversized.status, 404);
});
test("database failures do not expose internals or turn into zero analytics", async () => {
  broken = true;
  const result = await GET(new Request("https://ugc.community/api/analytics/postings"));
  assert.equal(result.status, 503); assert.doesNotMatch(await result.text(), /private database detail/);
  assert.equal(result.headers.get("cache-control"), "private, no-store");
});
