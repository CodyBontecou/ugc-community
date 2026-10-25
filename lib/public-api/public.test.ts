import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { D1Database } from "@/cloudflare-env";
import { handlePublicApi, type PublicApiBindings } from "./http";
import { handleJobsMcp } from "./mcp";
import { openapi } from "./openapi";
import { agentResponse } from "../agent-content/negotiation";

const mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('test'); } }", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
const db = await mf.getD1Database("JOB_BOARD") as D1Database;
const env: PublicApiBindings = { JOB_BOARD: db, PUBLIC_API_RATE_LIMITER: { limit: async () => ({ success: true }) } };
before(async () => {
  const migrations = new URL("../../migrations/job-board/", import.meta.url);
  for (const name of (await readdir(migrations)).filter(name => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(name, migrations), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
  }
  const now = new Date().toISOString(), future = new Date(Date.now() + 86400_000).toISOString(), old = new Date(Date.now() - 8 * 86400_000).toISOString();
  for (let i = 0; i < 24; i++) await insert(`public_${i}`, "published", "direct", future, now);
  await db.prepare("UPDATE board_jobs SET application_email=? WHERE id=?").bind("private-employer@example.com", "public_0").run();
  await insert("pending", "pending_review", "direct", future, now);
  await insert("closed", "closed", "direct", future, now);
  await insert("expired", "published", "direct", old, now);
  await insert("stale", "published", "external", future, old);
  async function insert(id: string, status: string, source: string, closing: string, verified: string) {
    await db.prepare(`INSERT INTO board_jobs (id,status,source_kind,company,title,description,compensation_type,compensation_text,cash_amount,application_url,closing_at,verified_at,submitter_email,review_notes,created_at,updated_at,published_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, status, source, "Brand", "Skincare UGC creator", "Make one video", "cash", "USD $250", 250, "https://example.com/apply", closing, verified, "private@example.com", "Private review notes", now, now, now).run();
  }
});
after(async () => { await mf.dispose(); });
const request = (path: string, init?: RequestInit) => new Request(`https://ugc.community${path}`, init);

test("search and details share visibility rules and never expose private columns", async () => {
  const response = await handlePublicApi(request("/api/v1/jobs?q=Skincare&pay=cash"), env);
  assert.equal(response.status, 200);
  const page = await response.json();
  assert.equal(page.total, 24); assert.equal(page.jobs.length, 20);
  assert.match(page.next, /page=2/);
  const serialized = JSON.stringify(page);
  assert.doesNotMatch(serialized, /private@example|private-employer@example|Private review notes|submitter_email|review_notes|application_email/);
  const next = await (await handlePublicApi(new Request(page.next), env)).json();
  assert.equal(next.jobs.length, 4); assert.equal(next.next, null);
  const job = await (await handlePublicApi(request("/api/v1/jobs/public_0"), env)).json();
  assert.equal(job.id, "public_0"); assert.equal(job.compensation.cashAmount, 250);
  for (const id of ["pending", "closed", "expired", "stale", "unknown"]) {
    const missing = await handlePublicApi(request(`/api/v1/jobs/${id}`), env);
    assert.equal(missing.status, 404, id);
    assert.equal((await missing.json()).code, "job_not_found");
  }
});

test("REST validates filters, returns JSON recovery errors, and rejects writes", async () => {
  for (const path of ["?page=0", "?page=Infinity", "?pay=bogus", "?source=private", "?q=" + "x".repeat(101), "?unexpected=1"]) {
    const response = await handlePublicApi(request("/api/v1/jobs" + path), env);
    assert.equal(response.status, 400); assert.match(response.headers.get("Content-Type")!, /application\/problem\+json/);
    assert.equal((await response.json()).code, "invalid_parameters");
  }
  const unknown = await handlePublicApi(request("/api/v1/not-real", { headers: { Accept: "text/markdown" } }), env);
  const wrapped = agentResponse(request("/api/v1/not-real", { headers: { Accept: "text/markdown" } }), unknown);
  assert.equal(wrapped.status, 404); assert.match(wrapped.headers.get("Content-Type")!, /application\/problem\+json/);
  const write = await handlePublicApi(request("/api/v1/jobs", { method: "POST" }), env);
  assert.equal(write.status, 405); assert.equal(write.headers.get("Allow"), "GET, HEAD, OPTIONS");
  assert.equal(await (await handlePublicApi(request("/api/v1/jobs", { method: "HEAD" }), env)).text(), "");
});

test("rate limits return Retry-After and errors never masquerade as empty results", async () => {
  const limited = await handlePublicApi(request("/api/v1/jobs"), { ...env, PUBLIC_API_RATE_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal(limited.status, 429); assert.equal(limited.headers.get("Retry-After"), "60");
  const failed = await handlePublicApi(request("/api/v1/jobs"), { ...env, PUBLIC_API_RATE_LIMITER: { limit: async () => { throw new Error("secret internal failure"); } } });
  assert.equal(failed.status, 503); assert.doesNotMatch(await failed.text(), /secret internal|"jobs"/);
});

async function rpc(method: string, params?: unknown, headers: Record<string,string> = {}) {
  return handleJobsMcp(request("/mcp", { method: "POST", headers: { Host: "ugc.community", "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26", ...headers }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, ...(params ? { params } : {}) }) }), env);
}
async function rpcBody(response: Response) {
  const text = await response.text();
  if (response.headers.get("Content-Type")?.includes("event-stream")) return JSON.parse(text.split("\n").find(line => line.startsWith("data: "))!.slice(6));
  return JSON.parse(text);
}

test("MCP initializes, discovers typed read-only tools, and calls the same public reader", async () => {
  const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "regression-test", version: "1" } });
  assert.equal(init.status, 200); assert.equal((await rpcBody(init)).result.serverInfo.name, "ugc-community");
  const list = await rpcBody(await rpc("tools/list"));
  assert.deepEqual(list.result.tools.map((tool: { name: string }) => tool.name).sort(), ["get_job", "search_jobs"]);
  for (const tool of list.result.tools) { assert.equal(tool.annotations.readOnlyHint, true); assert.ok(tool.inputSchema); assert.ok(tool.outputSchema); }
  const search = await rpcBody(await rpc("tools/call", { name: "search_jobs", arguments: { q: "Skincare" } }));
  assert.equal(search.result.structuredContent.total, 24);
  assert.doesNotMatch(JSON.stringify(search), /private@example|private-employer@example|Private review notes/);
  const missing = await rpcBody(await rpc("tools/call", { name: "get_job", arguments: { id: "pending" } }));
  assert.equal(missing.result.isError, true);
});

test("MCP rejects foreign origins and private operations and exposes its schema resource", async () => {
  assert.equal((await rpc("tools/list", undefined, { Origin: "https://evil.example" })).status, 403);
  const unknown = await rpcBody(await rpc("tools/call", { name: "apply_to_job", arguments: {} }));
  assert.ok(unknown.error || unknown.result.isError);
  const resources = await rpcBody(await rpc("resources/list"));
  assert.equal(resources.result.resources[0].uri, "https://ugc.community/openapi.json");
});

test("OpenAPI documents anonymous access and complete function-calling operations", () => {
  assert.deepEqual(openapi.security, []);
  const operations = Object.values(openapi.paths).map(path => path.get);
  assert.equal(new Set(operations.map(operation => operation.operationId)).size, 2);
  for (const operation of operations) { assert.ok(operation.description.length > 20); assert.deepEqual(operation.security, []); assert.ok(operation.responses[200].content["application/json"].schema); }
});
