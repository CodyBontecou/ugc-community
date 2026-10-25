import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPlatformProxy } from "wrangler";
import { syncJobBoard, type BoardBindings } from "../lib/job-board/sync";
import { supplyReport } from "../lib/job-board/search";
import { seedAuditLeads } from "../lib/job-board/seed";
import leads from "../content/jobs/audit-leads.json";
const remote = process.argv.includes("--remote"), seed = process.argv.includes("--seed-audit");
const config = JSON.parse(await readFile(resolve("wrangler.jsonc"), "utf8"));
const configPath = resolve(`.wrangler/job-sync-${remote ? "remote" : "local"}.jsonc`);
await mkdir(resolve(".wrangler"), { recursive: true });
await writeFile(configPath, JSON.stringify({ name: "ugc-job-board-sync", compatibility_date: config.compatibility_date, compatibility_flags: ["nodejs_compat"],
  r2_buckets: config.r2_buckets.filter((item: { binding: string }) => item.binding === "SUBSCRAPE_EXPORTS").map((item: object) => ({ ...item, remote })),
  d1_databases: config.d1_databases.filter((item: { binding: string }) => item.binding === "JOB_BOARD").map((item: object) => ({ ...item, remote })),
}));
const proxy = await getPlatformProxy<BoardBindings>({ configPath, persist: { path: resolve(".wrangler/state/v3") } });
try {
  if (seed) await seedAuditLeads(proxy.env.JOB_BOARD, leads);
  const sync = await syncJobBoard(proxy.env);
  const report = await supplyReport(proxy.env.JOB_BOARD);
  console.log(JSON.stringify({ location: remote ? "remote" : "local", sync, report }));
} finally { await proxy.dispose(); }
