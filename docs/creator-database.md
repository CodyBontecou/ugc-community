# Creator database (retired)

This product was retired on October 24, 2026. Its five-minute cron is disabled, `/database` redirects to `/jobs`, and its former APIs return 410. The historical architecture below is retained for reference. See `job-board.md` for current operations.

The creator database reads private Subscrape uploads from the `subscrape-exports` R2 bucket and indexes them in the `ugc-creator-database` D1 database. It does not change Subscrape or expose the raw bucket.

## Access and search

`/database` and `GET /api/database/creators` share the server-side entitlement check in `lib/creator-database/access.ts`. Until subscription entitlements exist, only signed-in emails in `ADMIN_EMAILS` can view live data. The public homepage retains a clearly labeled fictional preview. A normal creator account is not sufficient for database access.

The live directory searches usernames, shared link values, and post titles. Filters support Instagram, TikTok, YouTube, and email availability. It returns 25 authors per page and up to 30 recent source details per author. An open directory refreshes its server-rendered data once per minute while the browser tab is visible.

Records are grouped by the Reddit author who shared them. This grouping does not assert that every shared contact belongs to that author; the original post/comment and evidence remain attached. Generic links remain generic links, and candidate handles remain labeled candidates. Capture times describe collection, not contact verification.

## Automatic imports

The main Cloudflare Worker's `*/5 * * * *` scheduled handler runs the importer directly with R2 and D1 bindings. It does not call a public HTTP endpoint or depend on `CRON_SECRET`. The existing daily schedules remain separate.

Each invocation lists up to 20 objects from each of `incremental/` and `exports/`, using separate persisted cursors. When a prefix is exhausted its cursor resets, so late uploads and changed objects with earlier keys are found on later scans. Large backlogs may take multiple five-minute runs to finish. A D1 lease prevents overlapping sync jobs; a crash expires after ten minutes. Runs stop starting new objects after 50 seconds and replay the unfinished page next time.

Each object version is identified by its R2 ETag. Normalized rows stage under that version and become searchable only when an atomic D1 batch commits the object's checkpoint. Failed imports preserve the previous committed version and retry on the next full scan. Duplicate source records across exports collapse in search. An error ledger exposes the count of failing objects to administrators.

Supported formats: JSON arrays, JSONL, and Subscrape CSV (including quoted multiline fields and formula escapes). Limits: 8 MB per object and 10,000 records. Larger files are recorded as failures for an operator to split into smaller uploads. Malformed individual records, other subreddits, deleted authors, unsafe link schemes, and invalid source URLs are rejected; malformed whole files retry. Uploaded files are never modified or deleted.

Deleting an R2 object alone does not remove already imported data: the index is a durable ingestion store. Use suppression for removals, or implement an explicit reconciliation policy before treating bucket deletion as a removal signal.

## Operations

```sh
pnpm cf-typegen
pnpm db:creators:migrate
pnpm creators:sync --remote
pnpm test:creator-database
pnpm deploy:worker
```

`creators:sync --remote` runs the same importer against remote bindings using the owner's existing Wrangler login and prints only counts/status. Its temporary binding config is under ignored `.wrangler/`. Without `--remote`, it uses isolated local bindings. Never place exported contacts or credentials in tracked files.

Admins can request an immediate sync with `POST /api/database/sync` (same-origin session required). Scheduled imports work even when no administrator has the website open. The public API response for an unauthorized request contains no index results.

Generated runtime types are scoped to a module by `scripts/scope-cloudflare-types.mjs`, so Workers' global `Response` declarations do not override Next.js/browser types. Run `pnpm cf-typegen` after changing bindings.

## Corrections and removals

Suppress an author by inserting the lowercase Reddit username into `creator_suppressions` with a UTC timestamp. Every live search excludes suppressed authors, including after later imports. This currently requires an owner-run parameterized D1 operation; an admin removal interface and contact-level suppression are still follow-up work. Do not delete only an import checkpoint or source file to fulfill a removal request.

## Launch work

Subscription checkout, billing webhooks, subscriber entitlements, contact-level correction/removal tools, and database-specific subscription terms remain tracked in `.pi/todos/cdb00002.md` and `.pi/todos/cdb00003.md`. Live data stays private until access is deliberately granted.
