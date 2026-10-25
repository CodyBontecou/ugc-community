import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const root = process.cwd(), outdir = resolve(root, ".open-next/public-worker-bundle");
execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "deploy", "--dry-run", "--config", "wrangler.public.jsonc", "--outdir", outdir], { stdio: "inherit" });
const entry = await readFile(resolve(outdir, "public-worker.js"), "utf8");
if (Buffer.byteLength(entry) > 1024 * 1024 || entry.includes("next/dist/server/next-server") || entry.includes(".open-next/worker.js")) throw new Error("Public Worker must stay below 1 MiB and delegate Next routes through its APP service binding.");
console.log(`Public Worker entry verified: ${Buffer.byteLength(entry)} bytes; Next is isolated in the app service.`);
