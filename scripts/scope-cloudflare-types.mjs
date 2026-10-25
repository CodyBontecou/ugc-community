import { readFile, writeFile } from "node:fs/promises";

// Keep generated Worker runtime declarations out of the Next.js browser/Node
// global namespace (notably Response.json), while exposing binding types.
const path = new URL("../cloudflare-env.d.ts", import.meta.url);
const source = await readFile(path, "utf8");
await writeFile(path, `${source}\nexport type { D1Database, R2Object };\ndeclare global { interface CloudflareEnv extends __BaseEnv_CloudflareEnv {} }\n`);
