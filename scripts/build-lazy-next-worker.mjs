import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const root = process.cwd();
const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
// Prebundle Next independently so Wrangler's Node/workerd shims are retained.
// This command never publishes or changes routes/bindings.
config.main = resolve(root, ".open-next/worker.js");
config.assets.directory = resolve(root, config.assets.directory);
config.find_additional_modules = false;
delete config.base_dir;
config.rules = [];
const configPath = resolve(root, ".open-next/next-bundle.wrangler.json");
const outdir = resolve(root, ".open-next/next-bundle");
await mkdir(outdir, { recursive: true });
await writeFile(configPath, JSON.stringify(config));
execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "deploy", "--dry-run", "--config", configPath, "--outdir", outdir], { stdio: "inherit" });
const lazyDir = resolve(root, ".open-next/lazy");
await mkdir(lazyDir, { recursive: true });
await copyFile(resolve(outdir, "worker.js"), resolve(lazyDir, "next-worker.mjs"));
await writeFile(resolve(lazyDir, "next-loader.js"), 'export async function appHandler() { return (await import("./next-worker.mjs")).default; }\n');
console.log("Generated separately loaded Next worker with runtime shims.");

// Guard the startup boundary: a future import must not silently rebundle Next.
const publicOutdir = resolve(root, ".open-next/public-bundle");
execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "deploy", "--dry-run", "--config", resolve(root, "wrangler.jsonc"), "--outdir", publicOutdir], { stdio: "inherit" });
const publicEntry = await readFile(resolve(publicOutdir, "cloudflare-worker.js"), "utf8");
if (Buffer.byteLength(publicEntry) > 2 * 1024 * 1024 || publicEntry.includes("next/dist/server/next-server") || !publicEntry.includes('import("./next-worker.mjs")')) {
  throw new Error("Public Worker startup boundary regressed: Next must remain a separate lazy module and the entry must stay below 2 MiB.");
}
console.log(`Public Worker entry verified: ${Buffer.byteLength(publicEntry)} bytes; Next loads only when requested.`);
