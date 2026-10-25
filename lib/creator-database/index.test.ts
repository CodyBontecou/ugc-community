import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { normalizeMatch, parseExport } from "./records";
import { syncCreatorDatabase, type CreatorBindings } from "./sync";
import { searchCreators } from "./search";
import { parseSearchFilters } from "./filters";

const mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('test'); } }", compatibilityDate: "2026-07-25", d1Databases: ["DB"], r2Buckets: ["EXPORTS"] });
const db = await mf.getD1Database("DB");
const { EXPORTS: bucket } = await mf.getBindings<{ EXPORTS: CreatorBindings["SUBSCRAPE_EXPORTS"] }>();
const env = { CREATOR_DATABASE: db, SUBSCRAPE_EXPORTS: bucket };
const base = { type: "email", value: "hello@example.com", author: "CreatorOne", subreddit: "UGCcreators", source: "https://www.reddit.com/r/UGCcreators/comments/abc123/test/def456/", title: "Portfolio thread", evidence: "My portfolio and email", confidence: "explicit", capturedAt: "2026-10-24T12:00:00.000Z", included: true };
const filters = { query: "", platform: "" as const, emailOnly: false, page: 1 };
before(async () => {
  const schema = await readFile(new URL("../../migrations/creator-database/0001_creator_index.sql", import.meta.url), "utf8");
  // D1 exec requires individual SQL statements without leading comment lines.
  for (const statement of schema.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
});
after(async () => { await mf.dispose(); });

test("normalizes identities and rejects mismatched or unsafe source records", async () => {
  const match = await normalizeMatch(base);
  assert.equal(match?.author, "creatorone");
  assert.equal((await normalizeMatch({ ...base, value: "HELLO@EXAMPLE.COM" }))?.id, match?.id);
  for (const change of [{ subreddit: "other" }, { author: "[deleted]" }, { included: false }, { source: "https://evil.example/r/UGCcreators/comments/abc123/" }, { source: "https://www.reddit.com/r/other/comments/abc123/" }, { type: "instagram", value: "https://evil.example/" }, { type: "portfolio", value: "javascript:alert(1)" }, { capturedAt: "bad-date" }]) assert.equal(await normalizeMatch({ ...base, ...change }), null);
});

test("reads all Subscrape formats including quoted CSV and formula escapes", () => {
  assert.equal(parseExport(JSON.stringify([base]), "exports/a.json").length, 1);
  assert.equal(parseExport(JSON.stringify(base) + "\n", "incremental/a.jsonl").length, 1);
  assert.deepEqual(parseExport('\uFEFF"type","value","evidence"\r\n"handle","\'@hello","line one\nline ""two"""', "exports/a.csv"), [{ type: "handle", value: "@hello", evidence: 'line one\nline "two"' }]);
  assert.throws(() => parseExport('{bad}', "exports/a.jsonl"));
  assert.throws(() => parseExport('"type","value"\n"email","unfinished', "exports/a.csv"));
});

test("imports both prefixes, merges repeated sources, and catches late/new uploads", async () => {
  await bucket.put("exports/z.json", JSON.stringify([base, base, { ...base, subreddit: "other" }]));
  await bucket.put("incremental/z.jsonl", JSON.stringify({ ...base, type: "instagram", value: "https://instagram.com/example" }) + "\n");
  assert.equal((await syncCreatorDatabase(env)).imported, 2);
  let result = await searchCreators(db, filters);
  assert.equal(result.total, 1);
  assert.equal(result.creators[0].detailCount, 2);
  assert.equal(result.creators[0].details.length, 2);
  assert.equal((await syncCreatorDatabase(env)).imported, 0);
  // New key sorts before existing keys and must still be discovered.
  await bucket.put("incremental/a.json", JSON.stringify([{ ...base, author: "SecondCreator", value: "second@example.com" }]));
  await syncCreatorDatabase(env);
  result = await searchCreators(db, filters);
  assert.equal(result.total, 2);
  assert.equal((await searchCreators(db, { ...filters, query: "second@example" })).total, 1);
  assert.equal((await searchCreators(db, { ...filters, platform: "instagram", emailOnly: true })).total, 1);
  assert.equal((await searchCreators(db, { ...filters, query: "%" })).total, 0);
});

test("bad objects retry without hiding prior committed data; corrected versions replace it", async () => {
  await bucket.put("incremental/bad.jsonl", "not-json");
  assert.equal((await syncCreatorDatabase(env)).failed, 1);
  assert.equal((await searchCreators(db, filters)).sync.failures, 1);
  await bucket.put("incremental/bad.jsonl", JSON.stringify({ ...base, author: "FixedCreator", value: "fixed@example.com" }));
  await syncCreatorDatabase(env);
  assert.equal((await searchCreators(db, filters)).sync.failures, 0);
  await bucket.put("exports/z.json", "invalid-json");
  await syncCreatorDatabase(env);
  assert.equal((await searchCreators(db, { ...filters, query: "hello@example" })).total, 1);
  await bucket.put("exports/z.json", JSON.stringify([{ ...base, value: "replacement@example.com" }]));
  await syncCreatorDatabase(env);
  assert.equal((await searchCreators(db, { ...filters, query: "hello@example" })).total, 0);
  assert.equal((await searchCreators(db, { ...filters, query: "replacement@example" })).total, 1);
});

test("uncommitted staging is invisible, suppression survives uploads, and busy runs skip", async () => {
  await db.prepare("INSERT INTO creator_matches SELECT 'uncommitted', 'staged', record_id, 'invisible', type, value, source, title, evidence, confidence, captured_at FROM creator_matches LIMIT 1").run();
  assert.equal((await searchCreators(db, { ...filters, query: "invisible" })).total, 0);
  await db.prepare("INSERT INTO creator_suppressions VALUES (?, ?)").bind("creatorone", new Date().toISOString()).run();
  await bucket.put("incremental/suppressed.json", JSON.stringify([{ ...base, value: "another@example.com" }]));
  await syncCreatorDatabase(env);
  assert.equal((await searchCreators(db, { ...filters, query: "creatorone" })).total, 0);
  await db.prepare("UPDATE creator_sync_state SET lease_until=? WHERE id=1").bind(Date.now() + 60_000).run();
  assert.equal((await syncCreatorDatabase(env)).busy, true);
  await db.prepare("UPDATE creator_sync_state SET lease_until=0 WHERE id=1").run();
});

test("pagination counts filtered authors rather than individual matches", async () => {
  const records = Array.from({ length: 30 }, (_, index) => ({ ...base, author: `paged_creator_${index}`, value: `page${index}@example.com` }));
  await bucket.put("incremental/pages.json", JSON.stringify(records));
  await syncCreatorDatabase(env);
  const first = await searchCreators(db, { ...filters, query: "paged_creator" });
  const second = await searchCreators(db, { ...filters, query: "paged_creator", page: 2 });
  assert.equal(first.total, 30);
  assert.equal(first.creators.length, 25);
  assert.equal(second.creators.length, 5);
  assert.equal(new Set([...first.creators, ...second.creators].map(row => row.author)).size, 30);
  assert.equal(parseSearchFilters(new URLSearchParams("platform=bad&page=-5&q=%20test%20")).page, 1);
});

test("paged export scans resume beyond twenty objects and retry a changed early key", async () => {
  for (let index = 0; index < 22; index++) await bucket.put(`exports/paged-${String(index).padStart(2, "0")}.json`, JSON.stringify([{ ...base, author: `object_author_${index}`, value: `object${index}@example.com` }]));
  await syncCreatorDatabase(env);
  await syncCreatorDatabase(env);
  assert.equal((await searchCreators(db, { ...filters, query: "object_author" })).total, 22);
  await bucket.put("exports/paged-00.json", JSON.stringify([{ ...base, author: "object_author_new", value: "new-object@example.com" }]));
  await syncCreatorDatabase(env);
  await syncCreatorDatabase(env);
  assert.equal((await searchCreators(db, { ...filters, query: "object_author_new" })).total, 1);
  assert.equal((await searchCreators(db, { ...filters, query: "object0@example.com" })).total, 0);
});
