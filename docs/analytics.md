# Product analytics

The admin report lives at `/dashboard/admin/analytics`. Admin access uses the existing `ADMIN_EMAILS` allowlist, with a separate authorization check on JSON and CSV exports at `/api/analytics/report`. Supported rolling windows are 7, 30, and 90 days, with an equal previous-period comparison. Daily charts use America/Puerto_Rico (UTC−4); boundary days are partial.

## Collection and privacy

First-party telemetry is stored in the existing `JOB_BOARD` D1 database, independently of the legacy portfolio/Postgres statistics. Install `migrations/job-board/0004_behavior_analytics.sql` before releasing the app. The existing `pnpm db:jobs:migrate` command applies pending production migrations. The public collector returns 503 if storage or production rate limiting is unavailable. Business actions still succeed if recording their outcome fails.

Analytics begins only after explicit opt-in. `ugc.analytics.consent` in local storage remembers the decision; the Privacy page offers an Analytics preferences button. Do Not Track and Global Privacy Control override opt-in. Vercel analytics is also consent-gated and receives only allowlisted route templates, with query strings and fragments removed. The old AI-referral logging endpoint returns 410; referral measurement now uses the same consented pipeline.

An anonymous session cookie (`ugc_analytics_session`) expires after 30 minutes without measured activity. It uses Path=/, SameSite=Lax, and Secure on HTTPS. It has no account ID and does not identify a person across devices. Session storage preserves a coarse first-referrer category within the tab; no full referrer is sent. Device groups use viewport width. Query strings, search text, form fields, email addresses, account IDs, private share IDs, and raw IP addresses are excluded. The edge limiter uses an IP-derived request key without writing it to the event table or application logs.

Events are retained for 90 days. The existing daily authenticated `/api/cron/cleanup-views` task prunes them alongside legacy view deduplication. Monitor this cron for failures. Withdrawing consent stops future collection and removes the anonymous session cookie; previously recorded anonymous events expire through retention.

## Events

| Event | Meaning |
| --- | --- |
| `page_view` | Initial visit or client route/query navigation to an allowlisted page |
| `page_engagement` | Focused, visible page time, emitted every 15 seconds and on departure |
| `scroll_depth` | First reach of 25%, 50%, 75%, or 100% of document height per navigation |
| `job_search` | Filtered results view, including query presence, allowlisted pay/source filters, and page number; no search terms |
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
