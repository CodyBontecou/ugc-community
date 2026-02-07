import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { getJobById } from "@/lib/jobs/queries";
import { bulkInsertJobHooks } from "@/lib/jobs/hook-queries";

/**
 * POST /api/admin/jobs/[jobId]/hooks/import
 *
 * Accepts CSV text in the request body.
 * Expected format: hookText,screenshotUrl (header row optional)
 *
 * Query params:
 *   ?mode=replace  — clears existing hooks before importing (default: append)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { jobId } = await params;
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const replace = request.nextUrl.searchParams.get("mode") === "replace";

    const csvText = await request.text();
    if (!csvText.trim()) {
      return NextResponse.json({ error: "Empty CSV data" }, { status: 400 });
    }

    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found in CSV. Expected columns: hookText, screenshotUrl (optional)" },
        { status: 400 }
      );
    }

    const hooks = await bulkInsertJobHooks(jobId, rows, replace);

    return NextResponse.json({
      imported: hooks.length,
      hooks,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error importing job hooks:", error);
    return NextResponse.json({ error: "Failed to import hooks" }, { status: 500 });
  }
}

/**
 * Simple CSV parser that handles quoted fields.
 * Returns rows as { hookText, screenshotUrl? }.
 * Skips header row if first cell looks like "hook" or "hooktext".
 */
function parseCSV(text: string): { hookText: string; screenshotUrl?: string }[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const results: { hookText: string; screenshotUrl?: string }[] = [];
  let startIdx = 0;

  // Check for header row
  const firstCells = parseLine(lines[0]);
  const firstCell = firstCells[0]?.toLowerCase().replace(/[^a-z]/g, "");
  if (
    firstCell === "hook" ||
    firstCell === "hooktext" ||
    firstCell === "text" ||
    firstCell === "hooks"
  ) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const hookText = cells[0]?.trim();
    if (!hookText) continue;

    results.push({
      hookText,
      screenshotUrl: cells[1]?.trim() || undefined,
    });
  }

  return results;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  cells.push(current);
  return cells;
}
