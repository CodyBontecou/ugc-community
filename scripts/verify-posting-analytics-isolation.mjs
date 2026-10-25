import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Sessions must come from the normal sign-in flow. Never log or commit the state file.
// This creates up to two private review-queue jobs per account; it never publishes jobs or sends applications.
const statePath = process.argv[2];
if (!statePath) throw new Error("Provide a private test-session state file path");
const state = JSON.parse(await readFile(statePath, "utf8"));
const base = "https://ugc.community";
assert.match(state.run, /^analytics-[a-z0-9]+$/);
assert.equal(state.accounts.length, 2);
for (const account of state.accounts) {
  assert.ok(account.email.includes(state.run), "Use dedicated test-account aliases");
  assert.ok(["a", "b"].includes(account.label));
}
const checks = [];
const save = () => writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
function pass(label) { checks.push(label); console.log(`PASS ${label}`); }
async function request(path, account, init = {}) {
  return fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init, headers: { ...(account ? { Cookie: account.cookie } : {}), ...init.headers } });
}
function privateResponse(response) {
  assert.match(response.headers.get("cache-control") || "", /private.*no-store/);
  assert.match(response.headers.get("vary") || "", /cookie/i);
}
async function report(account, query = "") {
  const response = await request(`/api/analytics/postings${query}`, account);
  assert.equal(response.status, 200); privateResponse(response);
  return response.json();
}
async function rejected(account, jobId) {
  const response = await request(`/api/analytics/postings?job=${encodeURIComponent(jobId)}`, account);
  assert.equal(response.status, 404); privateResponse(response);
  assert.deepEqual(await response.json(), { error: "Posting not found" });
}
async function cleanup() {
  const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
  assert.ok(state.jobs?.length, "No recorded QA fixtures to clean up");
  assert.ok(state.analyticsSessions?.length, "No recorded analytics sessions");
  for (const account of state.accounts) {
    const session = await (await request("/api/auth/get-session", account)).json();
    assert.equal(session?.user?.id, account.id);
    assert.equal(session?.user?.email, account.email);
    assert.ok(session.user.name.startsWith("Analytics QA "));
  }
  for (const job of state.jobs) {
    assert.ok(job.title.startsWith(`INTERNAL QA - DO NOT PUBLISH - ${state.run} `));
    assert.ok(state.accounts.some(account => account.id === job.owner));
  }
  const ids = state.jobs.map(job => quote(job.id)).join(",");
  const owners = state.accounts.map(account => quote(account.id)).join(",");
  const sessions = state.analyticsSessions.map(quote).join(",");
  const scope = `id IN (${ids}) AND submitter_user_id IN (${owners}) AND source_kind='direct' AND status='pending_review' AND title IN (${state.jobs.map(job => quote(job.title)).join(",")})`;
  const eventScope = `session_id IN (${sessions}) AND json_extract(properties,'$.jobId') IN (${ids})`;
  {
    const cwd = fileURLToPath(new URL("../", import.meta.url));
    const execute = async command => {
      return JSON.parse(execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "JOB_BOARD", "--remote", "--command", command, "--json"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
    };
    const existing = (await execute(`SELECT id,title,status,submitter_user_id AS owner FROM board_jobs WHERE id IN (${ids})`)).flatMap(item => item.results || []);
    assert.equal(existing.length, state.jobs.length);
    for (const fixture of state.jobs) {
      const row = existing.find(job => job.id === fixture.id);
      assert.equal(row?.owner, fixture.owner); assert.equal(row?.title, fixture.title);
      assert.equal(row?.status, "pending_review", "Refuse cleanup if a fixture's review status changed");
    }
    const result = await execute(`DELETE FROM analytics_events WHERE ${eventScope}; DELETE FROM board_jobs WHERE ${scope}; SELECT COUNT(*) AS jobs_remaining FROM board_jobs WHERE id IN (${ids}); SELECT COUNT(*) AS events_remaining FROM analytics_events WHERE ${eventScope};`);
    const rows = result.flatMap(item => item.results || []);
    assert.equal(rows.find(row => "jobs_remaining" in row)?.jobs_remaining, 0);
    assert.equal(rows.find(row => "events_remaining" in row)?.events_remaining, 0);
  }
  for (const account of state.accounts) {
    const clearedResponse = await request("/api/analytics/postings", account);
    if (clearedResponse.status === 200) {
      const cleared = await clearedResponse.json(); assert.equal(cleared.totalJobs, 0); assert.equal(cleared.current.clicks, 0);
    } else {
      console.log(`NOTE analytics report unavailable during cleanup (${clearedResponse.status}); D1 fixture absence verified directly`);
    }
    const revoke = await request("/api/auth/revoke-sessions", account, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: "{}" });
    assert.equal(revoke.status, 200);
    const primaryCookie = account.cookie.split("; ").filter(cookie => cookie.includes("session_token=")).join("; ");
    assert.equal((await request("/api/analytics/postings", { cookie: primaryCookie })).status, 401);
    delete account.cookie;
  }
  state.cleanedAt = new Date().toISOString(); await save();
  console.log("PASS QA postings and events removed; all test-account server sessions revoked");
  console.log("Test identities retained for future verification; no authentication cookies remain in the state file.");
}
if (process.argv.includes("--cleanup")) { await cleanup(); process.exit(0); }
assert.ok(!state.jobs?.length || state.cleanedAt, "Clean up an existing fixture run before rerunning");
const [a, b] = state.accounts;
for (const account of state.accounts) {
  const session = await (await request("/api/auth/get-session", account)).json();
  assert.equal(session?.user?.id, account.id);
  assert.equal(session?.user?.email, account.email);
  assert.equal((await report(account)).totalJobs, 0, "Use fresh dedicated test accounts");
}
assert.notEqual(a.id, b.id); pass("Two distinct authenticated accounts start with empty reports");
state.jobs = [];
for (const [account, suffix] of [[a, "A"], [a, "A-zero"], [b, "B"]]) {
  const title = `INTERNAL QA - DO NOT PUBLISH - ${state.run} ${suffix}`;
  const body = { contactEmail: a.email, company: `Analytics verification ${state.run}`, title,
    description: "Internal analytics isolation verification only. Not a real opening. Do not publish or contact any employer.",
    compensationType: "cash", compensationText: "USD 25 per internal test video. This is test data, not an actual offer.", cashAmount: 25,
    deliverables: "Internal test only", eligibility: "No applicants", usageRights: "No usage rights granted; internal test only",
    applicationUrl: `${base}/jobs`, closingAt: new Date(Date.now() + 7 * 86400_000).toISOString() };
  const response = await request("/api/job-board/submissions", account, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify(body) });
  assert.equal(response.status, 201);
  const job = await response.json(); assert.equal(job.status, "pending_review");
  state.jobs.push({ id: job.id, owner: account.id, suffix, title }); await save();
}
const jobA = state.jobs.find(j => j.suffix === "A"), jobB = state.jobs.find(j => j.suffix === "B"), zero = state.jobs.find(j => j.suffix === "A-zero");
pass("Three jobs submitted through production API, all pending review, with a shared contact email");
for (const job of state.jobs) assert.equal((await request(`/api/v1/jobs/${job.id}`)).status, 404);
pass("Test jobs remain absent from the public jobs API");
state.analyticsSessions = [];
for (const [job, source, device, briefs, clicks] of [[jobA, "chatgpt", "mobile", 3, 1], [jobB, "social", "desktop", 1, 5]]) {
  const sessionId = crypto.randomUUID(); state.analyticsSessions.push(sessionId); await save();
  const events = ["job_impression", ...Array(briefs).fill("job_brief_open"), ...Array(clicks).fill("apply_click")].map(name => ({ id: crypto.randomUUID(), occurredAt: new Date().toISOString(), name, path: "/jobs", properties: { jobId: job.id, ...(name === "apply_click" ? { destination: "external" } : {}) } }));
  const payload = { consent: true, sessionId, source, device, events };
  const response = await request("/api/analytics/events", null, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, Cookie: `ugc_analytics_session=${sessionId}` }, body: JSON.stringify(payload) });
  assert.equal(response.status, 204);
  if (job === jobA) {
    const retry = await request("/api/analytics/events", null, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, Cookie: `ugc_analytics_session=${sessionId}` }, body: JSON.stringify(payload) });
    assert.equal(retry.status, 204);
  }
}
pass("Distinct consented activity ingested through production collector; A retried unchanged");
for (const days of [7, 30, 90]) {
  const ra = await report(a, `?days=${days}`), rb = await report(b, `?days=${days}`);
  assert.equal(ra.conversions.applyRate, 100); assert.equal(rb.conversions.applyRate, 100);
  assert.equal(ra.conversions.emailRate, 0); assert.equal(rb.conversions.emailRate, 0);
  assert.equal(ra.totalJobs, 2); assert.equal(rb.totalJobs, 1);
  assert.deepEqual(ra.current, { impressions: 1, briefs: 3, clicks: 1, sent: 0, sessions: 1 });
  assert.deepEqual(rb.current, { impressions: 1, briefs: 1, clicks: 5, sent: 0, sessions: 1 });
  assert.deepEqual(ra.jobs.map(j => j.id).sort(), [jobA.id, zero.id].sort());
  assert.deepEqual(rb.jobs.map(j => j.id), [jobB.id]);
  assert.deepEqual(ra.sources, [{ label: "chatgpt", sessions: 1 }]); assert.deepEqual(rb.sources, [{ label: "social", sessions: 1 }]);
  assert.deepEqual(ra.devices, [{ label: "mobile", sessions: 1 }]); assert.deepEqual(rb.devices, [{ label: "desktop", sessions: 1 }]);
  assert.equal(ra.daily.reduce((sum, day) => sum + day.clicks, 0), 1); assert.equal(rb.daily.reduce((sum, day) => sum + day.clicks, 0), 5);
  assert.doesNotMatch(JSON.stringify(ra), new RegExp(jobB.id)); assert.doesNotMatch(JSON.stringify(rb), new RegExp(jobA.id));
  for (const data of [ra, rb]) for (const field of ["submitter_email", "submitter_user_id", "review_notes", "session_id", "application_email", a.email, b.email]) assert.equal(JSON.stringify(data).includes(field), false);
}
pass("7/30/90-day summaries, jobs, daily activity, sources and devices stay isolated; retry counted once");
for (const [account, ownJob, foreignJob, foreignAccount] of [[a, jobA, jobB, b], [b, jobB, jobA, a]]) {
  const own = await report(account, `?job=${ownJob.id}`);
  assert.equal(own.totalJobs, 1); assert.equal(own.jobs[0].id, ownJob.id);
  await rejected(account, foreignJob.id); await rejected(account, crypto.randomUUID());
  await rejected(account, "' OR 1=1 --");
  const spoof = await report(account, `?userId=${foreignAccount.id}&owner=${foreignAccount.id}&accountId=${foreignAccount.id}`);
  assert.ok(spoof.jobs.every(j => j.id !== foreignJob.id));
  const forged = await request(`/api/analytics/postings?job=${foreignJob.id}&userId=${foreignAccount.id}`, account);
  assert.equal(forged.status, 404);
  const page = await request("/dashboard/postings", account);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes(ownJob.title)); assert.equal(html.includes(foreignJob.title), false);
  const foreignPage = await request(`/dashboard/postings?job=${foreignJob.id}`, account);
  const forbiddenHtml = await foreignPage.text();
  assert.equal(forbiddenHtml.includes(foreignJob.title), false);
  assert.ok(forbiddenHtml.includes("404") || forbiddenHtml.includes("could not be found"));
  assert.equal((await request("/api/analytics/report", account)).status, 401);
}
pass("Both users can open their own pages and reports; cross-owner IDs, spoofing and SQL-like IDs fail");
const empty = await report(a, `?job=${zero.id}`); assert.deepEqual(empty.current, { impressions: 0, briefs: 0, clicks: 0, sent: 0, sessions: 0 });
const paged = await report(a, "?page=99999&days=invalid"); assert.equal(paged.page, 1); assert.equal(paged.days, 30); assert.equal(paged.totalJobs, 2);
assert.equal((await request("/api/analytics/postings")).status, 401);
const tampered = { cookie: a.cookie.replace(/session_token=([^;])/, 'session_token=x$1') };
// Send only the tampered primary cookie so a signed cookie cache cannot hide tampering.
tampered.cookie = tampered.cookie.split('; ').filter(c => c.includes('session_token=')).join('; ');
assert.equal((await request("/api/analytics/postings", tampered)).status, 401);
pass("Zero-activity listing, bounded parameters, anonymous access and tampered session checks pass");
state.checks = checks; state.verifiedAt = new Date().toISOString(); await save();
console.log(`Completed ${checks.length} production isolation check groups; no applications or employer emails sent.`);
