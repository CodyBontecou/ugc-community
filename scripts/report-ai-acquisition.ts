import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { getPlatformProxy } from "wrangler";
import type { D1Database } from "@/cloudflare-env";
import { aiAcquisitionReport } from "@/lib/analytics/ai-acquisition";

const remote = process.argv.includes("--remote");
const outputIndex = process.argv.indexOf("--output");
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;
if (outputIndex >= 0 && (!output || output.startsWith("--"))) throw new Error("--output requires a file path");
const config = JSON.parse(await readFile(resolve("wrangler.jsonc"), "utf8"));
const configPath = resolve(`.wrangler/ai-acquisition-${remote ? "remote" : "local"}.jsonc`);
await mkdir(dirname(configPath), { recursive: true });
await writeFile(configPath, JSON.stringify({ name: "ugc-ai-acquisition-report", compatibility_date: config.compatibility_date, compatibility_flags: ["nodejs_compat"], d1_databases: config.d1_databases.filter((x: { binding: string }) => x.binding === "JOB_BOARD").map((x: object) => ({ ...x, remote })) }));
const proxy = await getPlatformProxy<{ JOB_BOARD: D1Database }>({ configPath, persist: { path: resolve(".wrangler/state/v3") } });
try {
  // Read-only aggregate queries. Never emit raw events, sessions, or account data.
  const report = { environment: remote ? "production" : "local", ...await aiAcquisitionReport(proxy.env.JOB_BOARD) };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (output) { await mkdir(dirname(resolve(output)), { recursive: true }); await writeFile(resolve(output), json); }
  process.stdout.write(json);
} finally { await proxy.dispose(); }
