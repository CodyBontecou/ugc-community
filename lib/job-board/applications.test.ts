import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import type { D1Database } from "@/cloudflare-env";
import { creatorProfileSchema, generateProfile, getCreatorProfile, saveCreatorProfile } from "./profiles";
import { submitApplication, type Application } from "./applications";
import { applicationEmailContent } from "./application-email";
import { listBoardJobs } from "./search";
import { reviewJob, submitDirectJob, storeSource } from "./store";
import { normalizeSource, submissionSchema, type BoardJob } from "./model";
const mf = new Miniflare({ modules: true, script: "export default { fetch() { return new Response('test'); } }", compatibilityDate: "2026-07-25", d1Databases: ["JOB_BOARD"] });
const db = await mf.getD1Database("JOB_BOARD") as unknown as D1Database;
const profile = { name: "Jamie", headline: "Skincare UGC creator", bio: "I make skincare product demonstrations and reviews.", location: "US", niches: "Skincare", availability: "November", instagram: "https://instagram.com/jamie", tiktok: "", youtube: "", portfolio: "" };
const input = { message: "I create skincare demos and would love to make your launch video.", consent: true };
const user = (id: string) => ({ id, email: `${id}@example.com`, emailVerified: true });
before(async () => {
  for (const file of ["0001_job_board.sql", "0002_applications.sql"]) {
    const sql = await readFile(new URL(`../../migrations/job-board/${file}`, import.meta.url), "utf8");
    for (const statement of sql.replace(/^--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
  }
});
after(async () => { await mf.dispose(); });
async function job(id: string, email: string | null = "apply@example.com") {
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO board_jobs (id, source_kind, status, company, title, description, application_email, application_url, created_at, updated_at, published_at)
    VALUES (?, 'direct', 'published', 'Brand', 'Skincare launch', 'Make a launch video', ?, 'https://example.com/form', ?, ?, ?)`)
    .bind(id, email, now, now, now).run();
}

test("profile validation rejects unsafe links and generation uses only supplied facts", () => {
  assert.equal(creatorProfileSchema.safeParse({ ...profile, instagram: "javascript:alert(1)" }).success, false);
  assert.equal(creatorProfileSchema.safeParse({ ...profile, instagram: "" }).success, false);
  const draft = generateProfile({ name: "Jamie", brief: profile.bio, location: "US", niches: "Skincare" });
  assert.match(draft.bio, /Jamie/); assert.match(draft.bio, /product demonstrations/);
  assert.equal(/followers|years|award/i.test(draft.bio), false);
});

test("saving updates one reusable profile while preserving its share link", async () => {
  const saved = await saveCreatorProfile(db, "profile-owner", profile);
  const updated = await saveCreatorProfile(db, "profile-owner", { ...profile, headline: "Updated headline" });
  assert.equal(saved.shareId, updated.shareId);
  assert.equal(updated.profile.headline, "Updated headline");
  assert.equal(await getCreatorProfile(db, "another-owner"), null);
});

test("only explicitly email-enabled jobs offer quick apply and public feed hides recipient", async () => {
  await job("email"); await job("form", null);
  const feed = await listBoardJobs(db, { q: "", source: "", pay: "", page: 1 });
  assert.equal(feed.jobs.find(row => row.id === "email")?.email_apply_enabled, 1);
  assert.equal(feed.jobs.find(row => row.id === "form")?.email_apply_enabled, 0);
  assert.equal("application_email" in feed.jobs[0], false);
  assert.equal("submitter_email" in feed.jobs[0], false);
});

test("submission requires verified email, consent, a profile, and an open email destination", async () => {
  const send = async () => { throw new Error("Must not send"); };
  await assert.rejects(() => submitApplication(db, { ...user("blocked"), emailVerified: false }, "email", input, send), /Verify/);
  await assert.rejects(() => submitApplication(db, user("no-profile"), "email", input, send), /Save your creator profile/);
  await saveCreatorProfile(db, "eligible", profile);
  await assert.rejects(() => submitApplication(db, user("eligible"), "form", input, send), /does not accept email/);
  await assert.rejects(() => submitApplication(db, user("eligible"), "email", { ...input, consent: false }, send));
  await job("closed"); await db.prepare("UPDATE board_jobs SET closing_at=? WHERE id='closed'").bind("2000-01-01T00:00:00.000Z").run();
  await assert.rejects(() => submitApplication(db, user("eligible"), "closed", input, send), /no longer open/);
});

test("retries keep original recipient, reply address, profile, and message and send once", async () => {
  await job("retry"); await saveCreatorProfile(db, "retry-user", profile);
  let attempts = 0;
  let snapshot: Application | undefined;
  await assert.rejects(() => submitApplication(db, user("retry-user"), "retry", input, async application => {
    snapshot = application; attempts++; throw new Error("Network timeout");
  }), /could not be confirmed/);
  assert.equal((await db.prepare("SELECT status FROM board_applications WHERE job_id='retry'").first<{ status: string }>())?.status, "failed");
  await saveCreatorProfile(db, "retry-user", { ...profile, name: "Changed name" });
  const result = await submitApplication(db, { ...user("retry-user"), email: "new@example.com" }, "retry", { ...input, message: "This new message should never replace the original." }, async (application, sentProfile) => {
    attempts++; assert.equal(application.id, snapshot?.id); assert.equal(sentProfile.name, "Jamie");
    assert.equal(application.message, input.message); assert.equal(application.reply_email, "retry-user@example.com");
    return "email-provider-id";
  });
  assert.equal(result.status, "sent");
  await submitApplication(db, user("retry-user"), "retry", input, async () => { throw new Error("Duplicate send"); });
  assert.equal(attempts, 2);
});

test("concurrent submits acquire one sending lease", async () => {
  await job("concurrent"); await saveCreatorProfile(db, "parallel-user", profile);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  let sends = 0;
  const first = submitApplication(db, user("parallel-user"), "concurrent", input, async () => { sends++; started(); await gate; return "one-send"; });
  await ready;
  try { await assert.rejects(() => submitApplication(db, user("parallel-user"), "concurrent", input, async () => { sends++; return "duplicate"; }), /being sent/); }
  finally { release(); }
  await first; assert.equal(sends, 1);
});

test("stale uncertain sends and changed email destinations cannot resend", async () => {
  await job("old"); await saveCreatorProfile(db, "old-user", profile);
  await assert.rejects(() => submitApplication(db, user("old-user"), "old", input, async () => { throw new Error("Timeout"); }));
  await db.prepare("UPDATE board_applications SET created_at=? WHERE job_id='old'").bind("2000-01-01T00:00:00.000Z").run();
  await assert.rejects(() => submitApplication(db, user("old-user"), "old", input, async () => "bad"), /needs checking/);
  await job("changed"); await saveCreatorProfile(db, "changed-user", profile);
  await assert.rejects(() => submitApplication(db, user("changed-user"), "changed", input, async () => { throw new Error("Timeout"); }));
  await db.prepare("UPDATE board_jobs SET application_email='different@example.com' WHERE id='changed'").run();
  await assert.rejects(() => submitApplication(db, user("changed-user"), "changed", input, async () => "bad"), /destination changed/);
});

test("daily application cap is enforced atomically", async () => {
  await saveCreatorProfile(db, "limited", profile);
  for (let i = 0; i < 11; i++) await job(`limit-${i}`);
  const results = await Promise.allSettled(Array.from({ length: 11 }, (_, i) => submitApplication(db, user("limited"), `limit-${i}`, input, async () => `provider-${i}`)));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 10);
  assert.equal(results.filter(result => result.status === "rejected").length, 1);
});

test("private contact email never automatically becomes application email", async () => {
  const data = submissionSchema.parse({ contactEmail: "private@example.com", company: "Direct", title: "Role", description: "Create content", compensationType: "cash", compensationText: "$100", cashAmount: 100, deliverables: "One video", eligibility: "US", usageRights: "Organic", applicationUrl: "https://example.com/form", closingAt: new Date(Date.now() + 86400_000).toISOString() });
  const id = await submitDirectJob(db, data, { id: "direct-brand", email: data.contactEmail });
  const row = await db.prepare("SELECT * FROM board_jobs WHERE id=?").bind(id).first<{ application_email: string | null; updated_at: string }>();
  assert.equal(row?.application_email, null);
  await reviewJob(db, { id, expectedUpdatedAt: row!.updated_at, action: "publish", company: data.company, title: data.title, description: data.description, compensationType: data.compensationType, compensationText: data.compensationText, cashAmount: data.cashAmount, deliverables: data.deliverables, eligibility: data.eligibility, usageRights: data.usageRights, applicationUrl: data.applicationUrl, applicationEmail: "hiring@example.com", closingAt: data.closingAt, campaignKey: "direct-role", notes: "Explicitly accepts email applications", verified: true });
  assert.equal((await db.prepare("SELECT application_email FROM board_jobs WHERE id=?").bind(id).first<{ application_email: string }>())?.application_email, "hiring@example.com");
});

test("employer email escapes user HTML and contains a useful profile CTA", () => {
  const content = applicationEmailContent({ id: "opaque-id", job_title: "Launch <video>", company: "Brand", message: "<script>alert(1)</script>" } as Application, { ...profile, name: "<img src=x>" });
  assert.equal(content.html.includes("<script>"), false);
  assert.equal(content.html.includes("<img src=x>"), false);
  assert.match(content.html, /View creator profile on ugc.community/);
  assert.match(content.text, /https:\/\/ugc.community\/applications\/opaque-id\/profile/);
});


test("external email applications require a mailbox present in the source brief", async () => {
  const now = new Date().toISOString();
  const source = (await normalizeSource({ type: "source", source: "https://www.reddit.com/r/UGCcreators/comments/emailproof/brief/", subreddit: "UGCcreators", title: "Hiring skincare creators", fullText: "Brand is hiring UGC creators for $100. Email applications and your portfolio to hiring@example.com.", publishedAt: now, capturedAt: now, classification: "paid_ugc_job" }))!;
  await storeSource(db, source);
  const row = await db.prepare("SELECT * FROM board_jobs WHERE source_key=?").bind(source.key).first<BoardJob>();
  assert.ok(row);
  const review = { id: row.id, expectedUpdatedAt: row.updated_at, action: "publish" as const, company: "Brand", title: "Skincare role", description: "Create skincare content for the upcoming brand campaign.", compensationType: "cash", compensationText: "$100 per video", cashAmount: 100, deliverables: "One video", eligibility: "US", usageRights: "Organic", applicationUrl: source.source, closingAt: null, campaignKey: "email-proof", notes: "Source explicitly accepts email applications.", verified: true };
  await assert.rejects(() => reviewJob(db, { ...review, applicationEmail: "unrelated@example.com" }), /must be explicitly stated/);
  await reviewJob(db, { ...review, applicationEmail: "hiring@example.com" });
  assert.equal((await listBoardJobs(db, { q: "Skincare role", source: "external", pay: "", page: 1 })).jobs[0]?.email_apply_enabled, 1);
});
