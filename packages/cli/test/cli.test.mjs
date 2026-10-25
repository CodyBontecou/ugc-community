import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "../bin/ugc-jobs.mjs";

test("CLI preserves filters, JSON output, and pagination from the public API", async () => {
  const lines = [];
  const code = await run(["jobs", "--q", "a & b", "--pay", "cash", "--page", "2", "--json"], {
    out: text => lines.push(text), fetcher: async url => {
      assert.equal(url.origin, "https://ugc.community"); assert.equal(url.searchParams.get("q"), "a & b"); assert.equal(url.searchParams.get("page"), "2");
      return Response.json({ jobs: [], total: 0, page: 2, pageSize: 20, next: null });
    },
  });
  assert.equal(code, 0); assert.equal(JSON.parse(lines[0]).page, 2);
});
test("CLI rejects writes, private paths and invalid arguments before making a request", async () => {
  for (const args of [["apply", "id"], ["job", "../admin"], ["jobs", "--page", "0"], ["jobs", "--source", "private"], ["jobs", "--q"], ["jobs", "--pay", "unknown"]]) {
    assert.equal(await run(args, { err: () => {}, fetcher: async () => { throw new Error("must not request"); } }), 1);
  }
});
test("CLI preserves server error details and exits nonzero", async () => {
  const errors = [];
  const code = await run(["jobs", "--json"], { err: text => errors.push(text), fetcher: async () => Response.json({ code: "rate_limit_exceeded", detail: "Too many requests", resolution: "Wait 60 seconds" }, { status: 429, headers: { "Retry-After": "60" } }) });
  assert.equal(code, 1); assert.equal(JSON.parse(errors[0]).code, "rate_limit_exceeded");
});
