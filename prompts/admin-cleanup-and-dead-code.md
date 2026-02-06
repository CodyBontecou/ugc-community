# Admin Cleanup & Dead Code Removal — Implementation Prompt (Phases 7-9)

## Context

Phases 1-6 are complete. The system now:
- **Generates** portfolios → uploads to Vercel Blob (no GitHub/Vercel API calls)
- **Serves** from Blob via middleware + serving route with serve-time injection
- **Enforces** via pure DB flag toggle (`siteEnabled`) + email notification

The old GitHub/Vercel infrastructure is now **completely unused in production paths** — but zombie code still exists in admin routes, library files, admin UI, scripts, and DB schema. This prompt cleans it all out.

## What to implement

### Phase 7: Rewrite admin routes that still use GitHub/Vercel APIs

Five admin API routes and one admin GitHub OAuth flow still reference the old infrastructure. Some get rewritten, some get deleted.

#### 7a. Rewrite `app/api/admin/creators/[userId]/site-toggle/route.ts`

This route currently calls `addDomain()`/`removeDomain()` on Vercel. Since enforcement is now a pure DB flag toggle, simplify:

- **Remove** imports: `addDomain`, `removeDomain`, `VercelApiError` from `@/lib/vercel`
- **Remove** `vercelProjectId` from the user select query and its validation check
- **Remove** the `addDomain()`/`removeDomain()` calls — the `domain` variable is no longer needed
- **Keep** the DB update (`siteEnabled = enabled`)
- **Keep** admin auth check, subdomain validation, response format
- The route becomes: auth → load user → validate subdomain exists → update `siteEnabled` in DB → return

#### 7b. Delete obsolete admin routes (3 routes)

These routes exist solely for the old GitHub→Vercel deployment pipeline and have no purpose in the blob architecture:

- **Delete** `app/api/admin/creators/[userId]/repo-status/route.ts` — checks Vercel project git linkage (irrelevant)
- **Delete** `app/api/admin/creators/[userId]/link-repo/route.ts` — links GitHub repo to Vercel project (irrelevant)
- **Delete** `app/api/admin/creators/[userId]/deployments/route.ts` — lists/triggers Vercel deployments (irrelevant)

#### 7c. Simplify `app/api/admin/users/[userId]/route.ts`

This is a large file (643 lines) with a PATCH handler that manages `vercelProjectId` and `githubRepoFullName`/`githubRepoId` updates, including auto-creating Vercel projects when linking repos. Significant cleanup:

- **Remove** the import: `createProject`, `VercelApiError` from `@/lib/vercel/client`
- **Remove** the `updateUserVercelProjectIdSchema` (the `vercelProjectId` zod schema)
- **Remove** the `updateUserGitHubRepoSchema` (the `githubRepoFullName`/`githubRepoId` zod schema)
- **Remove** `vercelProjectId`, `githubRepoFullName`, `githubRepoId` from the GET handler's user select query and response
- **Remove** the entire `vercelProjectId` update block in PATCH (the `if ("vercelProjectId" in body)` section)
- **Remove** the entire `githubRepoFullName`/`githubRepoId` update block in PATCH (the `if ("githubRepoFullName" in body || "githubRepoId" in body)` section including the Vercel project auto-creation logic)
- **Keep** all other PATCH operations (subdomain update, name update, etc.)
- **Keep** all other GET response fields

#### 7d. Delete admin GitHub OAuth flow (5 routes)

The admin GitHub connection was used to get a token for repo operations. No longer needed:

- **Delete** `app/api/admin/github/connect/route.ts` — initiates GitHub OAuth
- **Delete** `app/api/admin/github/callback/route.ts` — handles OAuth callback, stores token
- **Delete** `app/api/admin/github/disconnect/route.ts` — clears GitHub token
- **Delete** `app/api/admin/github/repos/route.ts` — lists admin's GitHub repos
- **Delete** `app/api/admin/github/status/route.ts` — checks if admin has GitHub connected
- **Delete** the entire `app/api/admin/github/` directory

### Phase 8: Clean up admin UI

#### 8a. Rewrite `app/(dashboard)/dashboard/admin/users/[userId]/page.tsx`

This is a large file (~2600 lines). The GitHub/Vercel sections need to be removed. Be surgical — this file has a lot of unrelated admin functionality to preserve.

**Remove from interfaces/types:**
- `vercelProjectId` from the `User` interface (or equivalent)
- `githubRepoFullName`, `githubRepoId` from the `User` interface
- The `GitHubRepo` interface entirely
- The `AdminGitHubStatus` interface entirely
- The `RepoLinkStatus` interface entirely
- The `Deployment` interface entirely

**Remove from component state:**
- All `vercelProjectId` state variables (`vercelProjectId`, `savingVercelProjectId`, `vercelProjectIdError`, `vercelProjectIdSuccess`)
- All GitHub repo selector state (`adminGitHubStatus`, `repos`, `repoSearch`, `repoDropdownOpen`, `loadingRepos`, `savingRepo`, `repoError`, `repoSuccess`, `vercelProjectCreated`)
- All repo linking state (`repoLinkStatus`, `loadingRepoStatus`, `linkingRepo`)
- All deployment state (`deployments`, `loadingDeployments`, `deploymentsError`, `triggeringDeployment`, `deploymentSuccess`)

**Remove functions:**
- `fetchAdminGitHubStatus`
- `fetchRepos` / repo search handler
- `handleSelectRepo` / `handleSaveRepo`
- `saveVercelProjectId` handler
- `fetchRepoLinkStatus`
- `handleLinkRepo`
- `fetchDeployments`
- `handleTriggerDeployment`
- `DeploymentStatusBadge` component

**Remove from JSX:**
- The entire "GitHub Repository" section (repo selector dropdown, current repo display)
- The entire "Repo Link Status" section (link status display, link button)
- The entire "Vercel Project ID" section (input, save button)
- The entire "Deployments" section (deployment list, trigger button)
- The site toggle button's `disabled` condition should no longer check `vercelProjectId` — only check that `subdomain` exists
- Any "not configured" messages that reference Vercel or GitHub

**Keep:**
- Site enable/disable toggle (but simplified — no Vercel dependency)
- Subdomain management
- Portfolio generation trigger
- All other admin user management (name, email, role, etc.)

**Simplify the site toggle:**
The toggle currently has `disabled={togglingSite || !user.vercelProjectId}`. Change to `disabled={togglingSite || !user.subdomain}`.

### Phase 9: Delete library files and clean up DB schema

#### 9a. Delete library files

- **Delete** `lib/github/push-portfolio.ts` — no remaining consumers (confirmed: `grep` shows zero imports)
- **Delete** `lib/vercel/client.ts` — no remaining consumers after Phase 7
- **Delete** `lib/vercel/index.ts` — re-export barrel, no remaining consumers

#### 9b. Update cleanup script

Edit `scripts/cleanup-portfolio.ts`:
- **Remove** the `githubRepoFullName: null`, `githubRepoId: null`, `vercelProjectId: null` from the user update
- **Add** a call to `deletePortfolio(subdomain)` from `@/lib/portfolio/storage` to clean up blob files
- The script becomes: find user → delete generation records → delete blob files → set `siteEnabled: false` → done

#### 9c. Remove DB schema fields (migration required)

Edit `lib/db/schema.ts`:

From the `users` table, remove:
- `vercelProjectId` column
- `githubAccessToken` column
- `githubUsername` column
- `githubRepoFullName` column
- `githubRepoId` column

Note: Also remove `githubConnectedAt` if it exists.

From the `portfolioGenerations` table, remove:
- `githubRepo` column (line 180)

After editing the schema:
```bash
npm run db:generate   # Generate the migration SQL
```

Review the generated migration to confirm it only drops the expected columns. Then:
```bash
npm run db:migrate    # Apply the migration
```

#### 9d. Remove npm dependency

```bash
npm uninstall @octokit/rest
```

Verify no remaining imports:
```bash
grep -rn "octokit" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
```

Should return zero results.

## Key reference files

- `app/api/admin/creators/[userId]/site-toggle/route.ts` — Rewrite to pure DB toggle (Phase 7a)
- `app/api/admin/creators/[userId]/repo-status/route.ts` — Delete (Phase 7b)
- `app/api/admin/creators/[userId]/link-repo/route.ts` — Delete (Phase 7b)
- `app/api/admin/creators/[userId]/deployments/route.ts` — Delete (Phase 7b)
- `app/api/admin/users/[userId]/route.ts` — Remove Vercel/GitHub sections (Phase 7c)
- `app/api/admin/github/*` — Delete entire directory (Phase 7d)
- `app/(dashboard)/dashboard/admin/users/[userId]/page.tsx` — Remove GitHub/Vercel UI sections (Phase 8a)
- `lib/github/push-portfolio.ts` — Delete (Phase 9a)
- `lib/vercel/client.ts` — Delete (Phase 9a)
- `lib/vercel/index.ts` — Delete (Phase 9a)
- `scripts/cleanup-portfolio.ts` — Update to use blob deletion (Phase 9b)
- `lib/db/schema.ts` — Remove dead columns (Phase 9c)

## Verification checklist

After all phases:
```bash
# No GitHub/Vercel library imports remain
grep -rn "from.*@/lib/vercel\|from.*@/lib/github" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
# → zero results

# No Octokit imports remain
grep -rn "octokit" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
# → zero results

# TypeScript compiles clean
npx tsc --noEmit

# Build succeeds
npm run build
```

## Execution order

Phases 7-9 have dependencies:
1. **Phase 7** (admin routes) — can run independently, removes consumers of lib files
2. **Phase 8** (admin UI) — can run in parallel with Phase 7
3. **Phase 9a** (delete lib files) — MUST run after Phase 7 (all consumers removed)
4. **Phase 9b** (cleanup script) — can run anytime
5. **Phase 9c** (DB migration) — run LAST, after confirming everything compiles
6. **Phase 9d** (remove npm dep) — run after Phase 9a

Recommended: do 7 → 8 → 9a → 9b → 9c → 9d, verifying `tsc --noEmit` after each phase.
