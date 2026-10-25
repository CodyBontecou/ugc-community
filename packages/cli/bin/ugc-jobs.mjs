#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

const help = `ugc-jobs — read-only ugc.community client (Node.js 20+)

  ugc-jobs jobs [--q keyword] [--source external|direct] [--pay type] [--page 1] [--json]
  ugc-jobs job ID [--json]
  ugc-jobs --help
  ugc-jobs --version

Pay types: cash, mixed, performance_only, affiliate, gifted_or_unpaid, unspecified.
No account or API key required. This CLI never applies, sends messages, or writes data.
Results contain 20 listings per page. Use --page to continue; JSON includes next.
Docs: https://ugc.community/docs
`;

export async function run(args, { fetcher = fetch, out = console.log, err = console.error } = {}) {
  const json = args.includes("--json");
  try {
    if (!args.length || args.includes("--help") || args.includes("-h")) { out(help); return 0; }
    if (args.length === 1 && args[0] === "--version") { out("1.0.1"); return 0; }
    const [command, ...rest] = args;
    const url = new URL("https://ugc.community/api/v1/jobs");
    if (command === "jobs") {
      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === "--json") continue;
        const key = rest[i].slice(2);
        if (!rest[i].startsWith("--") || !["q", "source", "pay", "page"].includes(key) || !rest[i + 1] || rest[i + 1].startsWith("--")) throw new Error(`Invalid argument: ${rest[i]}. Use --help.`);
        url.searchParams.set(key, rest[++i]);
      }
      if ((url.searchParams.get("q") || "").length > 100) throw new Error("--q must be at most 100 characters.");
      if (url.searchParams.has("source") && !["external", "direct"].includes(url.searchParams.get("source"))) throw new Error("--source must be external or direct.");
      if (url.searchParams.has("pay") && !["cash", "mixed", "performance_only", "affiliate", "gifted_or_unpaid", "unspecified"].includes(url.searchParams.get("pay"))) throw new Error("Invalid --pay category. Use --help.");
      const page = Number(url.searchParams.get("page") || 1);
      if (!Number.isInteger(page) || page < 1 || page > 10000) throw new Error("--page must be an integer from 1 to 10000.");
    } else if (command === "job") {
      const ids = rest.filter(value => value !== "--json");
      if (ids.length !== 1 || !/^[A-Za-z0-9_-]{1,200}$/.test(ids[0])) throw new Error("Use: ugc-jobs job ID [--json]");
      url.pathname += `/${ids[0]}`;
    } else throw new Error(`Unknown command: ${command}. Use --help.`);

    const response = await fetcher(url, { headers: { Accept: "application/json", "User-Agent": "ugc-community-cli/1.0.1" }, signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    if (!response.ok) {
      if (json) err(JSON.stringify(data));
      else err(`${data.code || `HTTP ${response.status}`}: ${data.detail || "Request failed."}\n${data.resolution || "See https://ugc.community/docs."}${response.headers.get("Retry-After") ? `\nRetry after ${response.headers.get("Retry-After")} seconds.` : ""}`);
      return 1;
    }
    if (json) { out(JSON.stringify(data, null, 2)); return 0; }
    const jobs = command === "jobs" ? data.jobs : [data];
    if (command === "jobs") out(`${data.total} opportunities · page ${data.page}\n`);
    for (const job of jobs) out(`${job.title} — ${job.company}\nID: ${job.id}\n${job.source} · ${job.compensation.type}: ${job.compensation.text}\nEligibility: ${job.eligibility || "Not stated"}\nApply: ${job.applicationUrl || "See the listing on ugc.community"}\nSource: ${job.sourceUrl || "Posted directly"}\n`);
    if (!jobs.length) out("No matching public opportunities. Try different filters.");
    if (data.next) out(`Next page: ugc-jobs jobs ${[...url.searchParams].filter(([key]) => key !== "page").map(([key, value]) => `--${key} ${JSON.stringify(value)}`).join(" ")} --page ${data.page + 1}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    err(json ? JSON.stringify({ code: "client_error", detail: message, resolution: "Check arguments, network access, and https://ugc.community/docs." }) : message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) process.exitCode = await run(process.argv.slice(2));
