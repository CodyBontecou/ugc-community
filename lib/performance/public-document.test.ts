import { test } from "node:test";
import assert from "node:assert/strict";
import { publicDocument } from "../public-site/response";
import { publicDocumentRequest } from "../public-site/request";

test("standalone public renderer preserves safe HTML, filters, private isolation, and native controls", async () => {
  const job = { id: "safe-id", source_kind: "direct", title: "<script>unsafe</script>", company: "Fixture", description: "A public brief", compensation_type: "cash", compensation_text: "$500", published_at: "2026-10-25T00:00:00Z", application_url: "https://example.com/apply" };
  const statement = { bind: () => statement, first: async () => ({ total: 1, cash: 1, direct: 1, nextClosing: null, oldestExternal: null }), all: async () => ({ results: [job] }) };
  const state = { ready: false, validUntil: 0 };
  const env = { JOB_BOARD: { prepare: () => statement }, __ugcPublicRender: state } as unknown as CloudflareEnv;
  for (const cookie of [undefined, "better-auth.session_token=private"]) {
    const response = await publicDocument(new Request("https://ugc.community/?q=fixture&pay=cash", { headers: cookie ? { Cookie: cookie } : {} }), env, { css: "", fonts: [], htmlClass: "", script: "/public-site/browser-test.js" });
    const html = await response.text();
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/); assert.doesNotMatch(html, /<script>unsafe/);
    assert.match(html, /<details/); assert.match(html, /data-analytics-job-id="safe-id"/); assert.match(html, /value="fixture"/);
    assert.match(html, /<link rel="canonical" href="https:\/\/ugc.community\/"/);
    assert.match(html, /data-consent="granted"/); assert.match(html, /data-consent="denied"/);
    assert.doesNotMatch(html, /static\/chunks|self\.__next|private|session_token/);
    assert.match(html, /\/public-site\/browser-/);
    assert.equal(state.ready, true);
  }
});
test("RSC, actions, Markdown and portfolio rewrites retain the Next handler", () => {
  assert.equal(publicDocumentRequest(new Request("https://ugc.community/jobs?pay=cash")), true);
  for (const headers of [new Headers({RSC:"1"}),new Headers({"Next-Action":"action"}),new Headers({Accept:"text/markdown"})]) assert.equal(publicDocumentRequest(new Request("https://ugc.community/",{headers})),false);
  for (const path of ["/api/jobs","/dashboard","/?subdomain=test"]) assert.equal(publicDocumentRequest(new Request("https://ugc.community"+path)),false);
});
