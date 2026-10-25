import { z } from "zod";

export const MATCH_TYPES = ["email", "instagram", "tiktok", "youtube", "portfolio", "url", "handle"] as const;
export type MatchType = (typeof MATCH_TYPES)[number];
export const MAX_EXPORT_BYTES = 8_000_000;
export const MAX_EXPORT_RECORDS = 10_000;

const rawMatch = z.object({
  type: z.enum(MATCH_TYPES),
  value: z.string().trim().min(1).max(10_000),
  author: z.string().regex(/^[a-zA-Z0-9_-]{3,20}$/),
  subreddit: z.string(),
  source: z.string().max(2000),
  title: z.string().max(1000).default(""),
  evidence: z.string().max(20_000).default(""),
  confidence: z.enum(["explicit", "candidate"]).default("explicit"),
  capturedAt: z.string(),
  included: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
});

export interface CreatorMatch {
  id: string;
  author: string;
  type: MatchType;
  value: string;
  source: string;
  title: string;
  evidence: string;
  confidence: "explicit" | "candidate";
  capturedAt: string;
}

export async function normalizeMatch(input: unknown): Promise<CreatorMatch | null> {
  const parsed = rawMatch.safeParse(input);
  if (!parsed.success) return null;
  const row = parsed.data;
  if (row.included === false || row.included === "false" || row.subreddit.toLowerCase() !== "ugccreators") return null;
  if (["automoderator", "deleted", "removed"].includes(row.author.toLowerCase())) return null;
  let source: URL;
  try { source = new URL(row.source); } catch { return null; }
  if (source.protocol !== "https:" || !["reddit.com", "www.reddit.com", "old.reddit.com"].includes(source.hostname) || source.username || source.password || source.port || !/^\/r\/ugccreators\/comments\/[a-z0-9]+(?:\/|$)/i.test(source.pathname)) return null;
  source.search = "";
  source.hash = "";
  const date = new Date(row.capturedAt);
  if (!Number.isFinite(date.getTime())) return null;
  let value = row.value;
  if (row.type === "email") {
    if (!z.email().safeParse(value).success) return null;
    value = value.toLowerCase();
  } else if (row.type !== "handle") {
    let url: URL;
    try { url = new URL(value); } catch { return null; }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const domains = { instagram: ["instagram.com"], tiktok: ["tiktok.com"], youtube: ["youtube.com", "youtu.be"] };
    if (row.type === "instagram" || row.type === "tiktok" || row.type === "youtube") {
      if (!domains[row.type].some(domain => host === domain || host.endsWith(`.${domain}`))) return null;
    }
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_.*|fbclid|igsh|igshid|si)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    value = url.href;
  }
  const author = row.author.toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([author, row.type, value, source.href])));
  const id = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return { id, author, type: row.type, value, source: source.href, title: row.title, evidence: row.evidence, confidence: row.confidence, capturedAt: date.toISOString() };
}

// Mirrors Subscrape's CSV quoting and spreadsheet-formula escaping.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(cell); rows.push(row); row = []; cell = "";
      if (rows.length > MAX_EXPORT_RECORDS + 1) throw new Error("Too many export records");
    } else cell += char;
  }
  if (quoted) throw new Error("Invalid CSV quoting");
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const columns = rows.shift() || [];
  if (new Set(columns).size !== columns.length) throw new Error("Duplicate CSV columns");
  return rows.filter(values => values.some(Boolean)).map(values => {
    if (values.length !== columns.length) throw new Error("Invalid CSV column count");
    return Object.fromEntries(columns.map((name, index) => [name, values[index].replace(/^'(?=[\s]*[=+\-@\t\r])/, "")]));
  });
}

export function parseExport(text: string, key: string): unknown[] {
  text = text.replace(/^\uFEFF/, "");
  let rows: unknown;
  if (key.endsWith(".jsonl")) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length > MAX_EXPORT_RECORDS) throw new Error("Too many export records");
    rows = lines.map(line => JSON.parse(line));
  } else if (key.endsWith(".json")) rows = JSON.parse(text);
  else if (key.endsWith(".csv")) rows = parseCsv(text);
  else throw new Error("Unsupported export format");
  if (!Array.isArray(rows) || rows.length > MAX_EXPORT_RECORDS) throw new Error("Invalid export record list");
  return rows;
}
