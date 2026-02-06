# Blob-Based Portfolio Architecture — Implementation Prompt

## Context

We're migrating creator portfolio hosting from **per-creator GitHub repos + per-creator Vercel projects** to **Vercel Blob storage served through our main Next.js app**. This eliminates external service sprawl, simplifies the deployment pipeline, and enables instant platform-wide updates via serve-time injection.

### Current architecture (being replaced)
Each creator portfolio = 1 GitHub repo + 1 Vercel project + 1 subdomain. Generation pipeline: Claude generates HTML/CSS/JS → push to GitHub → create Vercel project → link repo → add subdomain domain → trigger deploy. Enforcement adds/removes domains via Vercel API.

### New architecture (being implemented)
All portfolios stored as files in Vercel Blob under `portfolios/{subdomain}/`. One wildcard domain (`*.ugc.community`) on the main Vercel project. Middleware detects subdomains and rewrites to a serving route that fetches from Blob and injects platform code (tracking, contact forms) at serve-time. Generation pipeline: Claude generates HTML/CSS/JS → upload to Blob → done.

## What to implement

Check the todo list (`todo list-all`) for the full phased plan. Phases 1-4 are the foundation and can be built first. The key files to create/edit:

### New files to create
1. **`lib/portfolio/storage.ts`** — Blob upload/delete/list functions for portfolio files
2. **`lib/portfolio/platform-injections.ts`** — Serve-time HTML/JS injection (tracking pixel, contact form handler, analytics)
3. **`app/api/portfolio-serve/[subdomain]/[...path]/route.ts`** — Route handler that fetches from Blob, applies injections, serves with correct Content-Type and Cache-Control

### Existing files to edit
4. **`middleware.ts`** — Add subdomain detection at top of function; rewrite `{subdomain}.ugc.community` requests to the serving route

## Key reference files (read these first)

- `lib/storage/blob-client.ts` — Existing Vercel Blob usage patterns (`put`, `del` from `@vercel/blob`)
- `lib/agent/portfolio-generator.ts` — The `GeneratedFile` type, current `injectTrackingAndContactForm()` function to extract from, and `addFaviconFiles()` for understanding file types (text vs binary/base64)
- `lib/inngest/functions/generate-portfolio.ts` — Current generation pipeline (GitHub + Vercel orchestration) that will be simplified in a later phase
- `middleware.ts` — Current middleware structure to extend with subdomain detection
- `lib/db/schema.ts` — User schema with `subdomain`, `siteEnabled` fields used for access control
- `lib/portfolio/status.ts` — Existing portfolio status logic (reference for how `siteEnabled` is used)

## Technical decisions

### Blob storage
- Use `@vercel/blob` (`put`, `del`, `list`) — already a dependency
- Path pattern: `portfolios/{subdomain}/{filename}` (e.g., `portfolios/johndoe/index.html`)
- Use `addRandomSuffix: false` for deterministic, overwritable paths
- `access: "public"` so the serving route can fetch by URL
- Handle both text files (HTML/CSS/JS) and binary files (favicons — `isBinary: true` in `GeneratedFile` means content is base64-encoded)

### Serve-time injection (not bake-time)
Platform code is injected when serving, NOT when uploading. This means changing `platform-injections.ts` and deploying the main app instantly updates ALL portfolios. The blob stores only the raw creative output from Claude.

**HTML injection** (into index.html at serve-time):
- Tracking pixel before `</body>`: `<img src="https://ugc.community/api/portfolio/track?subdomain={subdomain}" ...>`
- Future: analytics scripts, cookie banner, "Powered by" badge — all in `</head>` or `</body>` slots

**JS injection** (appended to script.js at serve-time):
- Contact form handler IIFE that POSTs to `https://ugc.community/api/portfolio/contact`
- Uses the subdomain to identify the creator

See the current `injectTrackingAndContactForm()` in `lib/agent/portfolio-generator.ts` for the exact code to extract.

### Middleware subdomain detection
- Parse `Host` header: `johndoe.ugc.community` → subdomain = `johndoe`
- Skip non-portfolio hosts: `www`, `ugc`, apex domain, `localhost`
- Dev mode: support `?subdomain=johndoe` query param on localhost for testing
- Rewrite to: `/api/portfolio-serve/{subdomain}{pathname}` (default pathname to `/index.html` for `/`)
- Return early — don't apply main app middleware (security headers, bot blocking) to portfolio requests

### Serving route
- Look up creator by subdomain in DB → 404 if not found or `siteEnabled === false`
- Fetch raw file from Blob URL
- Apply injections based on file type (HTML gets platform code, JS gets contact handler, everything else passes through)
- Set Content-Type from file extension
- Set Cache-Control: HTML=1hr, CSS/JS=1day, images=1week
- Consider caching the DB lookup (one page load = ~4 requests for same subdomain)

## What NOT to change yet

- Don't modify `lib/inngest/functions/generate-portfolio.ts` yet — that's Phase 5 (after the serving layer works)
- Don't modify `lib/agent/portfolio-generator.ts` yet — keep the current `injectTrackingAndContactForm()` in place until we cut over
- Don't touch enforcement cron, GitHub code, or Vercel client code yet
- Don't remove any DB schema fields yet

The goal of this session is to build the **serving layer** (Phases 1-4) so it can be tested independently before rewiring the generation pipeline.
