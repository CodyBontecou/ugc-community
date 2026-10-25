import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPlatformProxy } from "wrangler";
import { syncCreatorDatabase, type CreatorBindings } from "../lib/creator-database/sync";
import { searchCreators } from "../lib/creator-database/search";

const remote = process.argv.includes("--remote");
const config = JSON.parse(await readFile(resolve("wrangler.jsonc"), "utf8"));
const configPath = resolve(`.wrangler/creator-sync-${remote ? "remote" : "local"}.jsonc`);
await mkdir(resolve(".wrangler"), { recursive: true });
await writeFile(configPath, JSON.stringify({
  name: "ugc-creator-database-sync",
  compatibility_date: config.compatibility_date,
  compatibility_flags: ["nodejs_compat"],
  r2_buckets: config.r2_buckets.filter((item: { binding: string }) => item.binding === "SUBSCRAPE_EXPORTS").map((item: object) => ({ ...item, remote })),
  d1_databases: config.d1_databases.map((item: object) => ({ ...item, remote })),
}));
const proxy = await getPlatformProxy<CreatorBindings>({ configPath, persist: { path: resolve(".wrangler/state/v3") } });
try {
  const result = await syncCreatorDatabase(proxy.env);
  const search = await searchCreators(proxy.env.CREATOR_DATABASE, { query: "", platform: "", emailOnly: false, page: 1 });
  console.log(JSON.stringify({ location: remote ? "remote" : "local", ...result, authors: search.total, ...search.sync }));
} finally { await proxy.dispose(); }
