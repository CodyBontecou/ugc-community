# Recommended for App implementation

The canonical report now scores **100/100**, with all 11 essential checks passing. The final App view passes 18 of 19 recommendations. The broader report passes 21 of 24 recommended checks (18.3/20), with five bonus points. Evidence: [app-report.json](app-report.json). Public report: https://is-agentic.com/scan/ugc.community

The public interfaces now support the recommended agent workflows without exposing account data or write operations.

| Interface | Public location | Behavior |
| --- | --- | --- |
| Developer docs | https://ugc.community/docs | Authentication policy, examples, limits, recovery errors, versioning and deprecation policy |
| REST search | https://ugc.community/api/v1/jobs | Keyword, source, compensation and page filters; 20 jobs per page; next URL |
| REST detail | /api/v1/jobs/{id} | Same visibility and expiry rules as search; unknown and private IDs share a 404 |
| OpenAPI 3 | https://ugc.community/openapi.json | Unique operation IDs, typed input and output schemas, anonymous security contract |
| MCP | https://ugc.community/mcp | Official MCP SDK, stateless Streamable HTTP, read-only search_jobs and get_job tools, typed structured outputs |
| MCP discovery | /.well-known/mcp/server-card.json and /.well-known/mcp.json | Remote endpoint and server identity |
| API catalog | /.well-known/api-catalog | Machine-readable API discovery |
| CLI | https://ugc.community/downloads/ugc-community-cli-1.0.1.tgz | Install with npm; ugc-jobs searches or reads public jobs; Node.js 20+ |

## Privacy and request handling

REST, MCP, and CLI use the shared job-board query and its publication/expiry rules. An explicit output projection excludes submitter emails, employer application emails, source archives, review notes, account details, and application records. The interfaces do not submit applications, send messages, or mutate records.

The public REST interface rejects writes and invalid filters, returns RFC problem details with recovery hints, supports HEAD and CORS, and preserves JSON errors even when a caller requests Markdown. REST and MCP share a Cloudflare binding limit of 120 requests per IP per minute per Cloudflare location; throttled responses include Retry-After. The MCP transport checks Host and Origin, bounds request bodies to 16 KiB, and creates fresh server instances per request.

The stable contract is /api/v1. Additive fields are allowed; breaking changes use a new major version. Docs promise at least 90 days' notice before removing stable operations, signaled through Deprecation, Sunset, and migration links. No operation is currently deprecated.

## Verification

- All 48 tests passed: 44 repository/database/interface tests and four CLI tests.
- TypeScript passed; lint had zero errors and 17 pre-existing warnings.
- Cloudflare production build and deployment passed.
- Live REST search and detail returned current public jobs. MCP initialized, listed tools and resources, and returned structured search results.
- Installing the hosted CLI tarball in a clean temporary prefix produced version 1.0.1 and successfully searched production. An npm executable symlink regression is covered by a test.
- Applied the pending additive 0002_applications.sql D1 migration required by the current main branch's shared queries.
- IndexNow accepted the homepage, docs, guide, About and Contact URLs with HTTP 202. The public verification key is checked in, and the deployment script now looks in public/ for it.

## External follow-ups

npm registry publication still needs an authenticated publisher: npm whoami returned E401 on this Mac. The package name ugc-community-cli was not found in the registry at verification time; the prepared package is installable directly from the site without registry credentials.

The owner-supplied business mailing address is now published in Organization PostalAddress metadata and on the Contact page. Live HTML verification confirmed all address fields. The refreshed scan confirms the Organization schema check passes. Search-based recommendations depend on the search provider indexing and ranking the pages; an accepted IndexNow submission does not guarantee either.

The earlier 98-point report remains in final-report.json as historical evidence. Use the Rescan button after deployments to request fresh technical checks; a new report URL or query marker alone may still reuse Ora's cached snapshot. Agent journey and search observations may remain cached separately from current HTTP checks.

## Final scan

The canonical scan at 2026-10-25T01:51:22.469Z confirms that versioning, deprecation policy, and Organization schema all pass. The dedicated /docs/deprecation page, rel=deprecation API response link, and OpenAPI x-deprecation-policy metadata are live. Active operations have no fictional Sunset date. The only remaining partial App recommendation is registry-published CLI; npm publication requires login. The broader report also retains search discovery findings. The historical agent journey can describe older site content even after current technical checks improve.

Final production deployment: c7046ddd-52c1-4c2c-8f0e-bf3a63d2f76d.

Address deployment: 2bcd9f74-422d-4ec4-bc3d-833b0503a5a2. Focused lint, all four agent-content tests, and the Cloudflare production build passed. IndexNow accepted the updated homepage and Contact page with HTTP 200.
