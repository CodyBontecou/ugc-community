# ugc.community

A UGC job board with reviewed external opportunities, direct brand submissions, reusable creator profiles, and email applications.

## Main flows

- `/jobs`: search published opportunities by keyword, source, and compensation.
- `/post-job`: submit a brief for review.
- `/apply-profile`: create or edit a quick-apply profile and work links.
- `/dashboard`: manage your job search and view email application history.
- `/dashboard/admin/opportunities`: review listings and validate job supply.
- `/docs`: public REST API, MCP, and CLI documentation.

The app runs on Next.js and Cloudflare Workers through OpenNext. Cloudflare D1 stores job-board records; existing PostgreSQL accounts provide authentication and account status.

## Development

Use the pnpm version declared in `package.json`.

```sh
pnpm install
pnpm dev --webpack
```

Authentication needs the configured account database and auth settings. Job-board pages also need their Cloudflare bindings; a plain Next.js dev server can show unavailable states when bindings are absent. Keep local credentials out of Git.

## Checks

```sh
pnpm lint
pnpm build
pnpm test:job-board
pnpm test:public-api
pnpm test:agent-content
```

The job-board tests use local Miniflare databases and cover profiles, application isolation, sending retries, listing review, imports, and retired creator-program endpoints. Public-interface tests cover REST, MCP, and the CLI.

## Deployment

```sh
pnpm deploy
```

This builds for Cloudflare, deploys the Worker and assets, and submits recent sitemap URLs to IndexNow when its CLI is installed. Worker bindings and routes live in `wrangler.jsonc`. Scheduled work imports job sources and performs retention housekeeping.

## Retired creator program

Milestones, rewards, posting quotas, generated portfolio onboarding, campaign tracking, and media management are retired. Their private endpoints return HTTP 410; old dashboard pages redirect to the current job-board tools. Existing files and database records are preserved. External portfolio and social links remain supported in creator profiles.

The former Fly/Inngest worker workflow is manual-only. External-service and archived-data cleanup is tracked in [issue #6](https://github.com/CodyBontecou/ugc-community/issues/6).
