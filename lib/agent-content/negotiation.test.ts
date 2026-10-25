import { test } from "node:test";
import assert from "node:assert/strict";
import { agentResponse, prefersMarkdown } from "./negotiation";

test("Markdown negotiation honors explicit media types and quality preferences", () => {
  for (const accept of [null, "*/*", "text/html", "text/markdown;q=0", "text/markdown;q=0.2,text/html;q=0.9", "text/markdown;q=invalid"]) assert.equal(prefersMarkdown(accept), false, String(accept));
  for (const accept of ["text/markdown", "text/markdown; q=0.9, text/html;q=0.2", "TEXT/MARKDOWN, */*;q=0.8"]) assert.equal(prefersMarkdown(accept), true);
});

test("Markdown 404 retains status and security headers, removes stale body headers, and links recovery", async () => {
  const response = agentResponse(new Request("https://ugc.community/missing", { headers: { Accept: "text/markdown" } }), new Response("<h1>Missing</h1>", { status: 404, headers: { "Content-Type": "text/html", "Content-Length": "16", ETag: "old", Vary: "RSC", "X-Content-Type-Options": "nosniff" } }));
  assert.equal(response.status, 404);
  assert.match(response.headers.get("Content-Type")!, /^text\/markdown/);
  assert.equal(response.headers.get("Vary"), "RSC, Accept");
  assert.equal(response.headers.get("Content-Length"), null);
  assert.equal(response.headers.get("ETag"), null);
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.match(await response.text(), /\[agent guide\]\(https:\/\/ugc.community\/guide\)/);
});

test("HTML and non-404 error responses keep their bodies and status", async () => {
  for (const [status, accept] of [[200, "text/html"], [404, "text/html"], [403, "text/markdown"]] as const) {
    const response = agentResponse(new Request("https://ugc.community/", { headers: { Accept: accept } }), new Response("original body", { status, headers: { Vary: "RSC, Accept" } }));
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Vary"), "RSC, Accept");
    assert.equal(await response.text(), "original body");
  }
});

test("HEAD 404 returns no body", async () => {
  const response = agentResponse(new Request("https://ugc.community/missing", { method: "HEAD", headers: { Accept: "text/markdown" } }), new Response(null, { status: 404 }));
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "");
});
