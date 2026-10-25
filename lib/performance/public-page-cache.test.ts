import { test } from "node:test";
import assert from "node:assert/strict";
import { publicPageResponse, cacheablePublicRequest, publicRenderState, type PublicPageCache } from "./public-page-cache";

function harness() {
  const entries = new Map<string, Response>();
  const pending: Promise<unknown>[] = [];
  let renders = 0;
  const cache: PublicPageCache = {
    async match(request) { return entries.get(request.url)?.clone(); },
    async put(request, response) { entries.set(request.url, response.clone()); },
  };
  const ctx = { waitUntil(p: Promise<unknown>) { pending.push(p); } };
  const request = (path = "/", headers: Record<string, string> = {}) => new Request(`https://ugc.community${path}`, { headers: { Accept: "text/html", ...headers } });
  const env = { CF_VERSION_METADATA: { id: "version-one" } };
  const render = async (requestEnv: object) => {
    renders++;
    const state = publicRenderState(requestEnv)!;
    state.ready = true;
    state.validUntil = Infinity;
    return new Response(`public jobs ${renders}`, { headers: { "Content-Type": "text/html", "Cache-Control": "private, no-store" } });
  };
  return { entries, cache, ctx, request, env, render, pending, renders: () => renders };
}

test("public HTML cache avoids rerendering and separates paths, hosts and deployments", async () => {
  const h = harness();
  const first = await publicPageResponse(h.request(), h.env, h.ctx, h.render, h.cache);
  assert.equal(first.headers.get("X-Public-Page-Cache"), "MISS");
  await Promise.all(h.pending);
  const hit = await publicPageResponse(h.request(), h.env, h.ctx, h.render, h.cache);
  assert.equal(hit.headers.get("X-Public-Page-Cache"), "HIT");
  assert.equal(await hit.text(), "public jobs 1");
  assert.equal(hit.headers.get("X-Public-Valid-Until"), null);
  assert.equal(h.renders(), 1);
  await publicPageResponse(h.request("/jobs"), h.env, h.ctx, h.render, h.cache);
  await publicPageResponse(h.request(), { CF_VERSION_METADATA: { id: "version-two" } }, h.ctx, h.render, h.cache);
  await publicPageResponse(new Request("https://www.ugc.community/", { headers: { Accept: "text/html" } }), h.env, h.ctx, h.render, h.cache);
  assert.equal(h.renders(), 4);
});

test("account cookies, filtered URLs, API, RSC, Markdown and explicit reloads bypass caching", async () => {
  const h = harness();
  const requests = [h.request("/?pay=cash"), h.request("/dashboard"), h.request("/api/v1/jobs"),
    h.request("/", { Cookie: "session=private" }), h.request("/", { Authorization: "Bearer test" }),
    h.request("/", { RSC: "1" }), h.request("/", { "Next-Router-Prefetch": "1" }),
    h.request("/", { Accept: "text/markdown, text/html;q=0.5" }),
    h.request("/", { "Cache-Control": "no-cache" }), h.request("/", { "Cache-Control": "max-age=0" }),
    new Request("https://ugc.community/", { method: "POST", headers: { Accept: "text/html" } })];
  for (const request of requests) {
    assert.equal(cacheablePublicRequest(request), false);
    assert.equal((await publicPageResponse(request, h.env, h.ctx, h.render, h.cache)).headers.get("X-Public-Page-Cache"), "BYPASS");
  }
  assert.equal(h.entries.size, 0);
});

test("cached HTML never survives a listing deadline or the 30-second lifetime", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-25T12:00:00Z") });
  const h = harness();
  const render = async (env: object) => {
    const response = await h.render(env);
    publicRenderState(env)!.validUntil = Date.now() + 2500;
    return response;
  };
  await publicPageResponse(h.request(), h.env, h.ctx, render, h.cache);
  await Promise.all(h.pending);
  assert.equal([...h.entries.values()][0].headers.get("Cache-Control"), "public, max-age=2");
  t.mock.timers.tick(2500);
  assert.equal((await publicPageResponse(h.request(), h.env, h.ctx, render, h.cache)).headers.get("X-Public-Page-Cache"), "MISS");
  const regular = harness();
  await publicPageResponse(regular.request(), regular.env, regular.ctx, regular.render, regular.cache);
  await Promise.all(regular.pending);
  t.mock.timers.tick(30_000);
  assert.equal((await publicPageResponse(regular.request(), regular.env, regular.ctx, regular.render, regular.cache)).headers.get("X-Public-Page-Cache"), "MISS");
});

test("unavailable feeds, errors, session responses and cache failures remain safe", async () => {
  for (const scenario of ["not-ready", "error", "session", "expired"]) {
    const h = harness();
    await publicPageResponse(h.request(), h.env, h.ctx, async env => {
      const response = await h.render(env);
      if (scenario === "not-ready") publicRenderState(env)!.ready = false;
      if (scenario === "error") return new Response("unavailable", { status: 503 });
      if (scenario === "session") response.headers.set("Set-Cookie", "private=1");
      if (scenario === "expired") publicRenderState(env)!.validUntil = Date.now();
      return response;
    }, h.cache);
    await Promise.all(h.pending);
    assert.equal(h.entries.size, 0, scenario);
  }
  const h = harness();
  const failing: PublicPageCache = { async match() { throw Error("cache offline"); }, async put() { throw Error("cache offline"); } };
  const response = await publicPageResponse(h.request(), h.env, h.ctx, h.render, failing);
  await Promise.all(h.pending);
  assert.equal(await response.text(), "public jobs 1");
});

test("a warm public entry never serves or stores a personalized response", async () => {
  const h = harness();
  await publicPageResponse(h.request(), h.env, h.ctx, h.render, h.cache);
  await Promise.all(h.pending);
  const privateResponse = await publicPageResponse(h.request("/", { Cookie: "better-auth.session_token=private" }), h.env, h.ctx, async env => {
    publicRenderState(env)!.ready = true;
    publicRenderState(env)!.validUntil = Infinity;
    return new Response("private account", { headers: { "Content-Type": "text/html", "Cache-Control": "private, no-store", "Set-Cookie": "private=1" } });
  }, h.cache);
  assert.equal(privateResponse.headers.get("X-Public-Page-Cache"), "BYPASS");
  assert.equal(await privateResponse.text(), "private account");
  assert.equal(publicRenderState(h.env), undefined);
  const publicResponse = await publicPageResponse(h.request(), h.env, h.ctx, h.render, h.cache);
  assert.equal(await publicResponse.text(), "public jobs 1");
  assert.equal(h.entries.size, 1);
});
