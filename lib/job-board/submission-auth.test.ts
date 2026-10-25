import assert from "node:assert/strict";
import { mock, test } from "node:test";

let session: { user: { id: string; email: string } } | null = null;
let bindingReads = 0;
const saved: unknown[][] = [];
mock.module("../../lib/auth/session.ts", { namedExports: { getServerSession: async () => session } });
mock.module("../../lib/job-board/access.ts", { namedExports: { boardBindings: async () => { bindingReads++; return { JOB_BOARD: "test-db" }; } } });
mock.module("../../lib/job-board/store.ts", { namedExports: { submitDirectJob: async (...args: unknown[]) => { saved.push(args); return "new-job"; } } });
const { POST } = await import("../../app/api/job-board/submissions/route");
const input = { contactEmail: "hiring@example.com", company: "Brand", title: "UGC creator", description: "Create a product demo", compensationType: "cash", compensationText: "USD $250 per video", cashAmount: 250, deliverables: "One video", eligibility: "US", usageRights: "Organic only", applicationUrl: "https://example.com/apply", closingAt: new Date(Date.now() + 86400_000).toISOString(), userId: "spoofed-user" };
const request = (body: string) => new Request("https://ugc.community/api/job-board/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body });

test("anonymous submissions are rejected before validation or storage", async () => {
  for (const body of [JSON.stringify(input), "invalid json"]) {
    const response = await POST(request(body));
    assert.equal(response.status, 401);
    assert.match((await response.json()).error, /account or sign in/);
  }
  assert.equal(bindingReads, 0);
  assert.equal(saved.length, 0);
});

test("signed-in submissions use the session account and retain the private contact email", async () => {
  session = { user: { id: "authenticated-brand", email: "account@example.com" } };
  const response = await POST(request(JSON.stringify(input)));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: "new-job", status: "pending_review" });
  assert.deepEqual(saved[0][2], { id: "authenticated-brand", email: "hiring@example.com" });
  const invalid = await POST(request("invalid json"));
  assert.equal(invalid.status, 400);
  assert.equal(saved.length, 1);
});
