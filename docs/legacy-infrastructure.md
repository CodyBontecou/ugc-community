# Retired creator-program inventory

Issue: [#6](https://github.com/CodyBontecou/ugc-community/issues/6). Inventory started October 25, 2026.

## Repository findings

The Fly application is `ugc-community-worker` in `iad`, configured as a background process with no HTTP service. Its Inngest Connect entrypoint registers `generate-portfolio` for `portfolio/generate.requested` and `process-video` for `media/video.uploaded`. No active application route emits either event, and `/api/inngest` returns the retired-feature response. Package worker launch commands have been removed. The user explicitly approved disabling the manual Fly deployment workflow; GitHub confirms its state is `disabled_manually`. Worker code and the disabled workflow source remain for inspection and rollback until external retirement is verified.

The portfolio generator uses Anthropic and optionally Replicate, reads Neon records, and uploads files to Vercel Blob. The video processor downloads media, runs FFmpeg and writes thumbnails to Blob. Stopping this worker does not itself remove hosted portfolio files, but running or queued jobs can still mutate their records and files.

Existing portfolio serving, contact forms and view-retention housekeeping remain active. `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` must remain available to those paths. `lib/portfolio/storage.ts`, `lib/portfolio/admin-upload.ts` and the manual portfolio upload/configuration scripts support existing hosted content; preserve them. `scripts/cleanup-portfolio.ts` deletes data and is outside this retirement's deletion scope. `scripts/generate-portfolio.ts` is a legacy generation entrypoint, not part of the current product.

The legacy Neon tables are `onboarding_questionnaires`, `portfolio_generations`, `media`, `posts`, `hashtag_mentions`, `milestones`, `user_milestones`, `saved_creators`, `content_jobs`, and `job_hooks`. These are distinct from current D1 `board_jobs`, creator profiles and applications. No legacy rows or hosted objects have been deleted.

## Access and credential inventory

The Fly CLI is installed, but its initial app inventory failed because this Mac had no Fly login. Inngest queue access and local Neon/Blob credentials were also unavailable. An authenticated operator must complete the live checks below; repository findings cannot establish that there are no running machines or pending events.

GitHub has a repository secret named `FLY_API_TOKEN`, used by the existing manual deployment workflow. Production Cloudflare secret names include `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`, `APIFY_API_TOKEN`, `APIFY_WEBHOOK_SECRET`, `SCRAPE_CREATORS_API_KEY`, `RESEND_API_KEY`, and GitHub service credentials. These are retirement candidates, not verified revoked credentials. Check all consumers and the running Fly app before revoking provider keys; removal of a Worker binding alone does not revoke a provider key. Authentication, admin registration, database, Blob, cron and current job-board credentials are separate and must be preserved.

## Remaining live checks

1. Authenticate Fly and inventory `flyctl status --app ugc-community-worker --json`, `flyctl machine list --app ugc-community-worker`, `flyctl volumes list --app ugc-community-worker`, and secret names. Record machine state and attached storage before changing anything.
2. Inspect Inngest for running, queued and retrying executions of both legacy functions. Resolve pending work explicitly, then stop only the legacy Fly machines. Verify both the stopped machine state and disconnected Inngest worker. Do not destroy the app or volumes as part of this inventory.
3. With read access to the existing Neon and Blob store, run `node --import tsx scripts/inventory-legacy.ts`. It emits aggregate table counts, generation states and portfolio object totals, without user identities or file URLs. Missing credentials and failed reads are reported as unavailable rather than empty datasets.
4. Retire the unused GitHub deployment secret and verified legacy-only provider credentials after machine and queue checks. Record which provider keys were actually revoked, as distinct from deployment bindings removed.
5. Decide retention/migration separately for creator data and hosted files. Do not delete them or disable existing hosting to finish this issue.
