{
  "id": "babadc47",
  "title": "Phase 3: Add subdomain detection to middleware",
  "tags": [
    "implementation",
    "phase-3"
  ],
  "status": "done",
  "created_at": "2026-02-06T20:49:12.986Z"
}

## Overview
Update `middleware.ts` to detect subdomain requests from the `Host` header and rewrite them to the portfolio serving route. This replaces the need for per-creator Vercel projects — all subdomain traffic is handled by the main app.

## Tasks
- Add subdomain detection logic at the top of the `middleware()` function:
  - Parse `Host` header to extract subdomain (e.g., `johndoe` from `johndoe.ugc.community`)
  - Skip known non-portfolio hosts: `www`, `ugc`, `localhost`, bare apex domain
  - Handle `localhost` dev mode (e.g., use `?subdomain=johndoe` query param or `x-subdomain` header for local testing)
  - Rewrite subdomain requests to `/api/portfolio-serve/{subdomain}{pathname}`
  - Default pathname to `/index.html` when path is `/`
  - Return early — don't apply the rest of the main app middleware (security headers, bot blocking, etc.) to portfolio requests
- Update the matcher config if needed to ensure subdomain requests are captured

## Edge cases to handle
- Requests to `ugc.community` (apex) → normal app, no rewrite
- Requests to `www.ugc.community` → normal app, no rewrite
- Requests to `johndoe.ugc.community` → rewrite to portfolio serving
- Requests to `johndoe.ugc.community/styles.css` → rewrite with correct path
- Requests to `johndoe.ugc.community/favicon.ico` → rewrite (static asset from blob)
- Dev mode: `localhost:3000` needs a way to test subdomain serving

## Files
- Edit: `middleware.ts`

## Dependencies
- Phase 4 (the serving route must exist to rewrite to), but can be built first — rewrites to a 404 until the route exists
