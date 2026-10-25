import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPlatformProxy } from "wrangler";
import type { BoardBindings } from "../lib/job-board/sync";
import { agentReviewQueue, applyAgentDecision, agentDecisionSchema } from "../lib/job-board/agent-review";
import { z } from "zod";
import { recoverReviewCandidates } from "../lib/job-board/recover";
import { normalizeSideShiftCapture } from "../lib/job-board/sideshift";
import { storeSources } from "../lib/job-board/store";

const args = process.argv.slice(2), remote = args.includes("--remote");
const command = args.find(arg => !arg.startsWith("--"));
const file = args[args.indexOf("--file") + 1];
if (!["queue", "apply", "recover", "import-sideshift"].includes(command || "") || (["apply", "import-sideshift"].includes(command || "") && (!args.includes("--file") || !file))) {
  throw new Error("Usage: pnpm jobs:review queue [--remote] | recover [--remote] | import-sideshift --file <captures.json> [--remote] | apply --file <decision.json> [--remote]");
}
const config = JSON.parse(await readFile(resolve("wrangler.jsonc"), "utf8"));
const configPath = resolve(`.wrangler/job-review-${remote ? "remote" : "local"}.jsonc`);
await mkdir(resolve(".wrangler"), { recursive: true });
await writeFile(configPath, JSON.stringify({ name: "ugc-job-board-review", compatibility_date: config.compatibility_date,
  compatibility_flags: ["nodejs_compat"],
  d1_databases: config.d1_databases.filter((item: { binding: string }) => item.binding === "JOB_BOARD")
    .map((item: object) => ({ ...item, remote })),
}));
const proxy = await getPlatformProxy<Pick<BoardBindings, "JOB_BOARD">>({ configPath, persist: { path: resolve(".wrangler/state/v3") } });
try {
  if (command === "queue") console.log(JSON.stringify(await agentReviewQueue(proxy.env.JOB_BOARD)));
  else if (command === "recover") console.log(JSON.stringify(await recoverReviewCandidates(proxy.env.JOB_BOARD)));
  else if (command === "import-sideshift") {
    const raw = z.array(z.unknown()).min(1).max(100).parse(JSON.parse(await readFile(resolve(file), "utf8")));
    const sources = await Promise.all(raw.map(normalizeSideShiftCapture));
    if (sources.some(source => !source)) throw new Error("Every capture must be a successful public job response with matching identity; nothing imported");
    const latest = new Map<string, NonNullable<(typeof sources)[number]>>();
    for (const source of sources) {
      if (source && (!latest.has(source.key) || latest.get(source.key)!.capturedAt <= source.capturedAt)) latest.set(source.key, source);
    }
    await storeSources(proxy.env.JOB_BOARD, [...latest.values()]);
    console.log(JSON.stringify({ imported: latest.size, published: 0 }));
  }
  else {
    const raw = JSON.parse(await readFile(resolve(file), "utf8"));
    const decisions = z.array(agentDecisionSchema).min(1).max(100).parse(Array.isArray(raw) ? raw : [raw]);
    for (const decision of decisions) {
      await applyAgentDecision(proxy.env.JOB_BOARD, decision);
      console.log(JSON.stringify({ id: decision.review.id, saved: true, location: remote ? "remote" : "local" }));
    }
  }
} finally { await proxy.dispose(); }
