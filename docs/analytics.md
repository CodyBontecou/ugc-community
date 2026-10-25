# Product analytics

The admin report lives at `/dashboard/admin/analytics`. Admin access uses the existing `ADMIN_EMAILS` allowlist, with a separate authorization check on JSON and CSV exports at `/api/analytics/report`. Supported rolling windows are 7, 30, and 90 days, with an equal previous-period comparison. Daily charts use America/Puerto_Rico (UTC−4); boundary days are partial.

## Collection and privacy

First-party telemetry is stored in the existing `JOB_BOARD` D1 database, independently of the legacy portfolio/Postgres statistics. Install `migrations/job-board/0004_behavior_analytics.sql` before releasing the app. The existing `pnpm db:jobs:migrate` command applies pending production migrations. The public collector returns 503 if storage or production rate limiting is unavailable. Business actions still succeed if recording their outcome fails.

Analytics begins only after explicit opt-in. `ugc.analytics.consent` in local storage remembers the decision; the Privacy page offers an Analytics preferences button. Do Not Track and Global Privacy Control override opt-in. The consented D1 pipeline receives only allowlisted route templates, with query strings and fragments removed. The unsupported Vercel script is not loaded on Cloudflare. The old AI-referral logging endpoint returns 410; referral measurement now uses the same consented pipeline.

An anonymous session cookie (`ugc_analytics_session`) expires after 30 minutes without measured activity. It uses Path=/, SameSite=Lax, and Secure on HTTPS. It has no account ID and does not identify a person across devices. Session storage preserves a coarse first-referrer category within the tab; no full referrer is sent. Device groups use viewport width. Query strings, search text, form fields, email addresses, account IDs, private share IDs, and raw IP addresses are excluded. The edge limiter uses an IP-derived request key without writing it to the event table or application logs.

Events are retained for 90 days. The existing daily authenticated `/api/cron/cleanup-views` task prunes them alongside legacy view deduplication. Monitor this cron for failures. Withdrawing consent stops future collection and removes the anonymous session cookie; previously recorded anonymous events expire through retention.

## Events

| Event | Meaning |
| --- | --- |
| `page_view` | Initial visit or client route/query navigation to an allowlisted page |
| `page_engagement` | Focused, visible page time, emitted every 15 seconds and on departure |
| `scroll_depth` | First reach of 25%, 50%, 75%, or 100% of document height per navigation |
| `job_search` | Filtered results view, including query presence, allowlisted pay/source filters, and page number; no search terms |
| `job_impression` | At least 50% of a listing summary visible continuously for one second in a visible, focused tab |
| `job_brief_open` | Native disclosure opened, or legacy brief control expanded |
| `apply_click` | Apply link clicked, with public job ID and email/external destination category |
| `source_click` | Original source opened separately from applying |
| `navigation_click` | Internal navigation to a coarse destination category |
| `form_start` | First focus within a recognized form per navigation |
| `form_submit` | Browser submit event; this is an attempt, not a completed conversion |
| `form_error` | Native validation failure or inline form alert; no field values or error text |
| `profile_draft` | Creator generated a profile draft |
| `application_preview` | Creator advanced to the application preview |
| `profile_saved` | Server confirmed a profile save |
| `application_sent` | Server confirmed provider acceptance, deduplicated by application ID |
| `job_submitted` | Server saved a direct job for review, deduplicated by job ID |

Browser event batches are strict allowlists, capped at 20 events / 24 KB. No arbitrary event names or properties are accepted; clients cannot submit server outcome names. Events carry random IDs so retries are idempotent. Collection requires a trusted Origin, matching session cookie, and no privacy signal. Known bot user agents are ignored. Production requires the Cloudflare IP header and the existing edge rate limiter (separate `analytics:` key namespace).

Collection is best effort. A bounded in-memory queue flushes periodically and uses beacons on departures. Failures use backoff and do not affect navigation or business actions. Client occurrence times are clamped to the preceding five minutes to handle beacon arrival order without allowing arbitrary historical data. Server timestamps govern reporting windows and retention.

## Interpreting reports

- Sessions count distinct anonymous IDs with browser events. They are not unique users. Server-only outcomes do not fabricate browser sessions or device/referral dimensions.
- First browser event within the selected window determines referral/device attribution. Sessions beginning before the window may therefore have partial attribution. Daily session counts can include a session on multiple dates.
- Funnels require each preceding stage in order in the same session. They cover overall session journeys across listings, rather than requiring every action to concern the same job. Direct apply clicks without brief opens remain in click totals but not the browse funnel's final stage.
- A job application click is intent. External website completion is unknown. An email send means provider acceptance, not inbox delivery, a qualified application, an employer reply, or a hire.
- Profiles saved counts saves, including edits. It is not a count of newly registered creators.
- Consent refusal, privacy signals, blockers, authentication redirects, network errors, and unavailable storage reduce coverage. There is no historical backfill and no credible before/after conversion comparison until enough data has accumulated.
- CSV exports contain aggregate rows only and escape formula prefixes. JSON includes the complete aggregate report. Reports contain no per-person timelines.

## Verification and rollout

Run `pnpm test:analytics`, `pnpm test:job-board`, `pnpm test:public-api`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`.

Before deployment, apply the D1 migration, deploy the app, and verify that no requests occur before opt-in. After opt-in, check brief opens, external/email apply clicks, searches on both `/` and `/jobs`, profile saves, and a controlled application. Check decline/withdrawal, browser privacy signals, export authentication, and cleanup. Do not submit real applications merely to validate analytics. Follow-up is tracked in `.pi/todos/ana00001.md`.

## Job poster analytics

Any active signed-in account can open `/dashboard/postings` from the dashboard menu, dashboard home, or post-job page. It lists jobs submitted from that account, with review/publication status, brief opens, apply clicks, consented email sends, and anonymous interacting sessions. Select a listing to view only its activity. Reports offer 7/30/90-day windows, previous-period comparisons, daily totals, source/device breakdowns, and an aggregate JSON download.

`/api/analytics/postings` derives account scope from the authenticated session and checks current account status. Every report query joins events to direct jobs whose `submitter_user_id` matches that account. Supplying a different user ID, sharing a submission email, being an administrator, or knowing another job's ID does not grant access. An unowned/nonexistent selected job returns the same 404. Response caching is private/no-store with Vary: Cookie. No applicant information, raw session IDs, private submission emails, or internal review notes are returned.

Inventory is paginated at 20 jobs. Pending, rejected, closed, and zero-activity jobs remain visible to their owner. Summary metrics cover the complete selected scope rather than only the visible page. Listing impressions measure actual visibility of each listing summary. A repeat open/click is another event; interacting sessions deduplicate browser sessions. Email sends are consented analytics outcomes, so they can undercount actual applications. Referral/device breakdowns are drawn only from browser interactions with owned jobs.

Apply migration `0005_posting_analytics_indexes.sql` after `0004_behavior_analytics.sql` before deploying this feature. It adds indexes for account inventory and per-job event lookups. Older jobs without an associated submitting account cannot be claimed through contact email; any future ownership transfer needs a separate verified workflow.

## Production release

Analytics is deployed as of October 25, 2026. Production JOB_BOARD migrations 0004 and 0005 are applied. The initial analytics release commit `a50e9c2` was served by Cloudflare version `f209bbce-6953-4c69-977d-43e746ee789e`; prior version `2d43080b-ff58-491a-a7da-7253a184b70f` is the rollback reference. The release used a clean source archive and excluded unrelated uncommitted changes.

Production smoke checks confirmed protected report endpoints, sign-in redirects, origin checks, privacy-signal suppression, and a consented event reaching D1 exactly once across duplicate submissions. The synthetic event was removed after verification. The normal post-job authentication checks passed and IndexNow accepted 11 sitemap URLs. Signed-in owner/admin walkthroughs and observing the daily retention run remain in `ana00001`.

## Live owner-isolation verification: October 25, 2026

Two dedicated accounts were created through normal email verification using aliases of the operator's mailbox. They had distinct account IDs and sessions, but their job submissions deliberately shared the same contact email. Three test jobs were submitted through the production API and stayed in pending review: two belonging to A (one with zero activity) and one belonging to B. None appeared in the public jobs API.

| Live check | Result |
| --- | --- |
| A's report and rendered dashboard | Only A's two postings; 3 brief opens, 1 apply click, 1 anonymous interacting session |
| B's report and rendered dashboard | Only B's posting; 1 brief open, 5 apply clicks, 1 anonymous interacting session |
| 7/30/90-day windows | Correct isolated summaries, per-job counts, daily totals, referral sources and devices |
| Individual own posting | 200, one owned posting |
| Another account's posting ID | Generic 404 in both directions; browser showed a 404 page |
| Missing posting or SQL-like posting ID | Same generic 404 |
| Spoofed userId, owner and accountId query parameters | Session's own scope retained; no foreign posting returned |
| Ordinary poster requesting the sitewide admin report | 401 |
| Anonymous or tampered primary session cookie | 401 |
| JSON report download payload | Private/no-store, Vary: Cookie; no raw sessions, private submission contacts or review notes |
| Replayed event batch | Counted once |
| Zero-activity posting and extreme page/period parameters | Correct zero metrics and bounded defaults |

The test used synthetic consented collector activity rather than sending job applications. Both dashboards were inspected in the live browser. All three private postings and their ten unique analytics events were removed, their absence verified in production D1, and both accounts' server sessions revoked. Dedicated test identities remain available for future checks; no session credentials are committed.

A concurrent performance deployment (`ccb8060c-af1e-4f3f-bffd-e84377b189ad`) replaced the tested analytics release with an older snapshot during cleanup, causing missing-route 404s rather than a data leak. With the user's authorization, the performance and content chats coordinated a replacement. Version `4b5642d7-940c-41ce-8e01-a02d82c6fc41` restored analytics, and the live authentication/privacy guard passed again. Future deployments through the standard release script now run this guard as well.

Reusable checks:

- `node scripts/verify-analytics-auth.mjs` checks live route presence, anonymous access, origin rejection and DNT/GPC without creating data.
- `node scripts/verify-posting-analytics-isolation.mjs /private/path/state.json` runs authenticated isolation verification. The private state file needs a unique `analytics-<lowercase alphanumeric>` run marker and two fresh dedicated accounts, each with `label` (`a`/`b`), `email` containing the run marker, `id` and normal signed-in `cookie`. Keep it outside the repository with mode 0600. The script saves exact fixture identities as it runs.
- Add `--cleanup` to the isolation command after inspection. It validates dedicated test identities and the exact unpublished fixtures before deleting those D1 records, verifies absence, revokes their sessions and removes cookies from the private state file. It does not delete the test identities. Never point it at real employer accounts.

## Listing impressions and conversion rates

A browser records `job_impression` only after at least half of a listing summary is visible continuously for one second while the document is visible and focused. Scrolling out, hiding/blurring the tab, removing a row, leaving the route, or withdrawing consent cancels pending observation. The summary is observed rather than the expanded brief, so opening a long brief does not change the measurement target. Streamed or subsequently inserted rows are observed too. Unsupported browsers do not fabricate impressions. Tracking remains behind explicit consent and DNT/GPC suppression.

The browser emits once per listing per navigation. Poster reports deduplicate impressions by `(jobId, anonymous session)` within the selected period, so revisits and batch retries do not inflate the denominator. A visitor viewing two different jobs creates one opportunity for each job. Daily impression totals deduplicate within each calendar day; their sum can exceed the full-period count when a session crosses midnight. Raw event counts in administrator action breakdowns may include repeated navigations.

For each owned listing/session pair with a measured view, the report checks for later actions on that same listing and session in the selected window:

- View to brief rate: viewed listing sessions with a subsequent brief open / viewed listing sessions.
- View to apply-click rate: viewed listing sessions with a subsequent apply click / viewed listing sessions.
- View to email-send rate: viewed listing sessions with a subsequent server-confirmed email send / viewed listing sessions.

Each opportunity contributes at most once to each numerator. Overall rates sum opportunities and conversions across owned listings before dividing; they do not average per-job percentages. These are independent rates from a view, since creators may click Apply without opening a brief. External application completion, qualification and hiring remain unknown. Email sends indicate provider acceptance, not inbox delivery. Actions without a measured view remain in event totals but do not enter conversion numerators.

The owner API adds `impressions` to summary, per-job and daily metrics, `conversions` and `previousConversions` at report level, and `conversions` on each job. Rates are percentages rounded to one decimal, or `null` when no views were measured; the UI shows an em dash rather than inventing a zero baseline. Count fields (`impressions`, `opened`, `applied`, `sent`) explain the rates without exposing session identifiers. Previous-period comparisons use percentage-point differences.

All queries retain the direct-posting account ownership constraint. The existing analytics table and per-job index support the new event; no D1 migration is required. Views begin with the feature release. Historical clicks cannot reconstruct impressions or conversion rates. Local verification covers visibility timing/lifecycle, strict ingestion, duplicate/replayed events, chronological same-job attribution, weighted aggregates, historical missing baselines, previous periods and cross-owner isolation. A real browser fixture verified an impression after visibility and no duplicate on expansion, plus desktop and 390px report layouts.
