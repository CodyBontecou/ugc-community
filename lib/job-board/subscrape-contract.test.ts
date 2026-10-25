import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { normalizeSource, sourceKey, type BoardJob } from "./model";
import { syncJobBoard, type BoardBindings } from "./sync";
import { prefillSourceDrafts } from "./subscrape-draft";
import fixture from "./fixtures/subscrape-v1.json";
const mf = new Miniflare({modules:true,script:"export default {fetch(){return new Response('test')}}",compatibilityDate:"2026-07-25",d1Databases:["JOB_BOARD"],r2Buckets:["SUBSCRAPE_EXPORTS"]});
after(async()=>{await mf.dispose();});

test("accepts all four scraper communities and keeps canonical Reddit identities",async()=>{
 for(const subreddit of ["UGCcreators","UGC_forhire","UGCconnect","ugc"]){
  const url=`https://www.reddit.com/r/${subreddit}/comments/example123/job/`;
  const row=await normalizeSource({...fixture,subreddit,source:url,jobBoard:{...fixture.jobBoard,sourceUrl:url}});
  assert.ok(row);assert.equal(row.key,"reddit:example123:post");assert.equal(row.jobBoard?.cashAmount,200);
 }
 assert.equal(sourceKey("https://www.reddit.com/r/unrelated/comments/example123/job/"),null);
 assert.equal(await normalizeSource({...fixture,subreddit:"ugc"}),null);
 assert.equal(await normalizeSource({...fixture,source:fixture.source.replace("www.reddit.com","evil.example")}),null);
});

test("old exports still import; malformed or self-publishing drafts never become trusted",async()=>{
 assert.ok(await normalizeSource({...fixture,jobBoard:undefined}));
 assert.equal((await normalizeSource({...fixture,jobBoard:{...fixture.jobBoard,verified:true,status:"published"}}))?.jobBoard,null);
 assert.equal((await normalizeSource({...fixture,jobBoard:{...fixture.jobBoard,sourceKey:"reddit:different:post"}}))?.jobBoard,null);
 assert.equal((await normalizeSource({...fixture,jobBoard:JSON.stringify(fixture.jobBoard)}))?.jobBoard?.cashAmount,200);
 const original=await normalizeSource(fixture);const recaptured=await normalizeSource({...fixture,capturedAt:"2026-10-25T13:00:00.000Z",jobBoard:{...fixture.jobBoard,capturedAt:"2026-10-25T13:00:00.000Z"}});
 assert.equal(original?.revision,recaptured?.revision);
 assert.notEqual(original?.revision,(await normalizeSource({...fixture,jobBoard:{...fixture.jobBoard,applicationUrl:"https://example.com/new-apply"}}))?.revision);
 assert.ok(await normalizeSource({...fixture,classification:"creator_self_promotion",compensationType:"not_applicable",jobBoard:null}));
});

test("R2 import prefills private review columns, suppresses duplicate candidates and is idempotent",async()=>{
 const env=await mf.getBindings<BoardBindings>();
 const sql=await readFile(new URL("../../migrations/job-board/0001_job_board.sql",import.meta.url),"utf8");
 for(const statement of sql.replace(/^--.*$/gm,"").split(";").filter(s=>s.trim()))await env.JOB_BOARD.prepare(statement).run();
 const canonical=fixture;
 const duplicate={...fixture,source:fixture.source.replace("example123","duplicate123"),sourceId:"t3_duplicate123",duplicateOf:fixture.sourceId,
  jobBoard:{...fixture.jobBoard,sourceKey:"reddit:duplicate123:post",sourceUrl:fixture.source.replace("example123","duplicate123"),sourceKeys:["reddit:duplicate123:post",fixture.jobBoard.sourceKey],duplicateOf:fixture.jobBoard.sourceKey}};
 await env.SUBSCRAPE_EXPORTS.put("incremental/contract.jsonl",[canonical,duplicate].map(r=>JSON.stringify(r)).join("\n"));
 assert.equal((await syncJobBoard(env)).failed,0);
 const jobs=await env.JOB_BOARD.prepare("SELECT * FROM board_jobs").all<BoardJob>();assert.equal(jobs.results.length,1);
 const job=jobs.results[0];assert.equal(job.status,"pending_review");assert.equal(job.company,"Example Studio");assert.equal(job.cash_amount,200);assert.equal(job.application_url,"https://example.com/apply");assert.equal(job.verified_at,null);assert.equal(job.campaign_key,null);
 assert.ok(JSON.parse(job.review_notes).suggestedCampaignKey);
 assert.equal((await syncJobBoard(env)).imported,0);
 const originalObject=await env.SUBSCRAPE_EXPORTS.get("incremental/contract.jsonl");
 await env.JOB_BOARD.prepare("UPDATE board_imports SET etag=? WHERE object_key=?").bind(originalObject!.etag,"incremental/contract.jsonl").run();
 assert.equal((await syncJobBoard(env)).imported,1); // old importer checkpoint gets replayed once
 assert.equal((await syncJobBoard(env)).imported,0);
 // Replaying a draft cannot replace an already reviewed public listing.
 await env.JOB_BOARD.prepare("UPDATE board_jobs SET status='published', company='Reviewed company' WHERE id=?").bind(job.id).run();
 await prefillSourceDrafts(env.JOB_BOARD,[(await normalizeSource(fixture))!]);
 assert.equal((await env.JOB_BOARD.prepare("SELECT company FROM board_jobs WHERE id=?").bind(job.id).first<{company:string}>())?.company,"Reviewed company");
});
