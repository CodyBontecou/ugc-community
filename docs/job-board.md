# UGC job board

The launch model is a free searchable feed for creators, with reviewed external opportunities first and free direct brand submissions. Featured placement or hiring subscriptions are deferred until qualified applications demonstrate value. There is no checkout or paid creator access in this release.

## Public and admin flows

- `/` and `/jobs` use the same feed, with keyword, source, and compensation filters. Only published, unexpired listings appear.
- Every card says **External opportunity** or **Posted directly**. Applications go to the reviewer-confirmed destination, with a separate original-source link on external listings.
- `/post-job` accepts submissions without requiring an account. The API requires compensation type/details, deliverables, eligibility, usage rights, an application URL, and a future closing date. Cash/base-pay types require a positive guaranteed amount; currency, unit, and other pay conditions belong in the compensation details. Contact emails stay private and are not automatically verified. A single atomic insert enforces a five-submission daily limit per signed-in account or salted network hash for anonymous submissions. Raw IP addresses are not stored.
- `/dashboard/admin/opportunities` is the manual review queue and two-week supply report. Both the page and mutation/export APIs check `ADMIN_EMAILS` through the existing session system.
- Reviewers confirm employer, current application availability, compensation, and the destination. External publication requires full source text, a valid original posting date, and a short reviewed summary. Original source bodies remain private. Missing external deliverables/eligibility/usage rights display as “Not stated in the source.”
- A unique reviewer-assigned campaign identifier prevents publishing cross-posts as separate jobs. Reviewers reject duplicate source candidates or update the existing campaign.
- Closing dates are enforced on every feed query. External listings also become invisible seven days after the last manual review. A new scrape cannot renew freshness. Source edits withdraw a listing for review; deleted/removed sources close it. Updates use an optimistic concurrency check so a stale review cannot overwrite a newer source revision.

The existing Neon content-job/hook system remains historical campaign infrastructure. The new board uses separate D1 tables because its source evidence, compensation types, review rules, and measurement model differ. `/dashboard/jobs` now routes to the public feed.

## Source capture and imports

Subscrape v1.6 already saves complete `type: source` post/comment records with original dates, content status, classification, and source revisions in `subscrape-exports`. See its `src/sourceRecords.js` and `tests/source-archive.test.mjs`. This project consumes that contract; it does not alter the scraper or its upload ledger.

The Worker scans `incremental/` and `exports/` every ten minutes. It saves canonical Reddit source identities, the latest full text, original publication date, capture date, classification, and revision observations. Contact matches are counted as legacy input, never turned into jobs. Classifier labels create private candidates only. Old capture timestamps and parent-thread titles are never substituted for missing original dates.

Imports have ETag checkpoints, independent paginated prefix cursors, batch writes, and a ten-minute D1 lease. Replays are idempotent, and older source snapshots cannot overwrite newer ones. A run stops starting new objects after 50 seconds and resumes on a later scan. Limits are 8 MB and 10,000 records per export; failures are retained for retry/operator inspection. These checks consume uploads; Subscrape itself must continue running to collect new posts.

## Audit baseline and validation window

`content/jobs/audit-leads.json` preserves the five leads from `/Users/codybontecou/dev/subscrape/audits/2026-10-24/job-candidates.csv`. Seeding creates pending records only. The original audit had three explicit numeric cash excerpts, but none was independently verified open. Seeded excerpts do not count as qualifying jobs.

The migration initializes a persisted fourteen-day window once. Admins can see its exact start/end in Puerto Rico time and download JSON from `/api/job-board/supply`. The report shows distinct archived sources, full-text/date coverage, candidates, pending reviews, import failures, and daily qualifying campaign yield.

A new qualifying external job needs:

1. Full archived source text and its original publication date.
2. Publication and first observation inside the observation window.
3. A unique campaign identifier and manual publication/freshness review.
4. Explicit guaranteed cash (or mixed compensation with a positive guaranteed base).
5. A confirmed application destination and an unexpired closing date when one is stated.

`board_qualifications` records each qualifying campaign once. Routine closure/expiry does not erase historical yield. Rejection or correction away from guaranteed cash invalidates its credit. Counts are bounded to observed sources and are not a claim of comprehensive Reddit coverage. Performance-only, affiliate, gifted/unpaid, missing-date, or unreviewed leads do not inflate cash-job supply.

At the end of the window, assess qualifying jobs/day, source coverage, duplicate rejection reasons, missing terms, and time spent reviewing before deciding whether more sources or monetization are justified. Application clicks alone are not evidence of qualified applications.

## Operations

```sh
pnpm cf-typegen
pnpm db:jobs:migrate
pnpm jobs:sync --remote --seed-audit
pnpm test:job-board
pnpm cf:build
pnpm exec opennextjs-cloudflare deploy
```

Without `--remote`, the sync script uses local bindings. Temporary binding configs remain under ignored `.wrangler/`. `--seed-audit` is safe to repeat and does not publish anything. The authenticated `POST /api/job-board/sync` provides an immediate manual scan. Imports must never write test fixtures into the production source bucket.

## Retired creator-database product

The five-minute creator-import cron is disabled and replaced by job-source ingestion. `/database` redirects to `/jobs`; former database search, sync, and early-access APIs return 410. Historical creator data remains private in its existing database and is not deleted. The old database subscription tasks are superseded by this job-board launch.
