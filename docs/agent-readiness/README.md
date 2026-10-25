# Agent readiness verification

Latest verified result: **[100/100 on the canonical report](https://is-agentic.com/scan/ugc.community)**. See [app-recommendations.md](app-recommendations.md) and [app-report.json](app-report.json) for the public API, MCP, CLI and current recommendation evidence.

## Earlier website baseline

On October 24, 2026 (America/Puerto_Rico), ugc.community improved from **66/100 to 98/100** on Is Agentic. All six applicable essential checks pass (80/80); recommended checks contribute 15.5/20 and bonus signals 2.6 points. The reported total is rounded by the scanner.

Fresh report: https://is-agentic.com/scan/ugc.community%3Fagent-readiness%3D2

The `agent-readiness=2` query parameter selects the same homepage and distinguishes this saved verification link. A URL marker alone does not guarantee fresh Ora evidence; use the report's Rescan button after a deployment. The unmarked report can continue showing an earlier snapshot until it refreshes. A first iteration scored 77 after the browsing guide at `/docs` was misclassified as API documentation. The guide now lives at `/guide`, documents the supported website interface, and does not advertise unsupported interfaces. No public API or authentication permissions were added for scoring.

## Implemented behavior

- `Accept: text/markdown` on `/`, `/jobs`, `/about`, `/contact`, and `/guide` returns Markdown. HTML remains available at the same URLs. `Vary: Accept` distinguishes representations.
- Markdown jobs use the same public query, filters, freshness rules, and pagination as the HTML feed. A database failure is shown as unavailable, not an empty feed.
- Missing URLs retain HTTP 404 and offer Markdown recovery links when requested. HEAD responses have no body. Existing security headers are preserved.
- Public About, Contact, and agent browsing guide pages are linked from the footer, sitemap, and `/llms.txt`.
- Account pages are removed from the public sitemap. Sign-in explains that browsing jobs does not require an account; account authentication remains in place.
- The homepage includes a social preview image and an Organization contact point. Portfolio hosts keep their existing response behavior.

## Validation

- Full repository test run: 23 tests passed, including four new content-negotiation and error-response tests.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm lint`: zero errors, 17 existing warnings.
- Cloudflare production build: passed with `RESEND_API_KEY=re_build_placeholder` for eager build-time module initialization; runtime uses the existing Worker secret.
- Live HTTP checks: HTML and Markdown 200 responses, `Vary: Accept`, Markdown 404, guide and trust pages, sitemap excluding account pages, and `og:image`.
- Deployment version: `e1d298fe-4831-4aa4-9360-8b367e0133b0`. A transient Cloudflare asset-upload failure resolved on retry.

Run `pnpm test:agent-content` for the focused regression tests. Run `npx is-agentic 'https://ugc.community/?agent-readiness=2' --json` to retrieve the stored fresh report. Use the report's Rescan button after material changes; new markers can still reuse cached evidence.

## Remaining findings

Search results did not surface the brand or developer resources in the scanner's samples. The new public guide and metadata can help discovery as indexing catches up, but rankings are outside immediate deployment control. IndexNow submission was attempted; this checkout has no hosted IndexNow key configured.

Organization metadata has a contact point but no postal address. Add an address only if the owner supplies a real business mailing address intended for publication. Do not invent address fields to improve a score.

The machine-readable baseline and final reports are saved beside this file. Methodology and cache behavior: https://is-agentic.com/methodology

The subsequent public API, MCP and CLI implementation is documented in [app-recommendations.md](app-recommendations.md).
