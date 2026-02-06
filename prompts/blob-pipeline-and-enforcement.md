# Blob Pipeline & Enforcement — Implementation Prompt (Phases 5-6)

## Context

Phases 1-4 are complete. We have:
- **`lib/portfolio/storage.ts`** — Blob upload/delete/list/exists with deterministic paths
- **`lib/portfolio/platform-injections.ts`** — Serve-time injection of tracking pixel + contact form handler
- **`middleware.ts`** — Subdomain detection that rewrites `{subdomain}.ugc.community` → `/api/portfolio-serve/{subdomain}/...`
- **`app/api/portfolio-serve/[subdomain]/[...path]/route.ts`** — Serving route that fetches from Blob, applies injections, checks `siteEnabled`

Now we need to rewire the **generation pipeline** (Phase 5) and simplify the **enforcement cron** (Phase 6) to complete the architecture migration. After these, the system will generate → upload to Blob → serve from Blob → enforce via DB flag, with zero GitHub/Vercel API calls in the hot path.

## What to implement

### Phase 5: Update generation pipeline to use blob storage

Three files need editing, one event type needs updating.

#### 5a. Edit `lib/agent/portfolio-generator.ts`

The `generatePortfolio()` function currently bakes in platform code at generation time via `injectTrackingAndContactForm()`. Platform code is now injected at serve-time (Phase 2), so:

- **Remove** the `injectTrackingAndContactForm()` function entirely (~75 lines starting at `function injectTrackingAndContactForm(`)
- **Remove** the call to `injectTrackingAndContactForm()` inside `generatePortfolio()` (the line: `files = injectTrackingAndContactForm(files, questionnaire.subdomain, faviconResult?.htmlSnippet);`)
- **Remove** the `vercel.json` file addition at the end of `generatePortfolio()` (the block that pushes `{ path: "vercel.json", ... }` to files) — no longer deploying to a Vercel project
- **Keep** `addFaviconFiles()` — favicons are still uploaded as binary to Blob
- **Keep** `generatePortfolioFavicon()` call and the favicon HTML snippet logic — BUT since we removed the bake-time injection, the favicon HTML snippet currently had no consumer. For now, just remove the `faviconResult?.htmlSnippet` reference. Favicon *links* in `<head>` will be handled as a future enhancement to `platform-injections.ts` (the raw HTML from Claude already includes favicon links via the system prompt). Don't add favicon injection to `platform-injections.ts` in this phase.
- The function signature and return type (`GenerationResult`) stay the same

#### 5b. Rewrite `lib/inngest/functions/generate-portfolio.ts` (heavy rewrite)

This is the biggest change. The current function has 5 steps with extensive GitHub + Vercel orchestration. Simplify to 3 steps:

**Current flow (replace):**
1. `load-data` — loads questionnaire + user + resolves GitHub token (service token or admin fallback) + resolves repo name
2. `generate-with-claude` — calls `generatePortfolio()`
3. `push-to-github` — creates/verifies repo, pushes files via GitHub API
4. `deploy-to-vercel` — creates Vercel project, adds domain, links repo, triggers deployment
5. `mark-complete` — updates DB status

**New flow (implement):**
1. `load-data` — loads questionnaire + user (simplified — no GitHub token needed)
2. `generate-with-claude` — same as today, calls `generatePortfolio()`
3. `upload-and-activate` — uploads files to Blob via `uploadPortfolio()`, sets `siteEnabled = true` in DB, marks generation complete

**Specific changes:**

Remove all imports:
- `createPortfolioRepo`, `pushFilesToRepo`, `repoExists`, `getRepoInfo`, `waitForRepoInitialized` from `@/lib/github/push-portfolio`
- `createProject`, `addDomain`, `linkGitHubRepo`, `createDeployment` from `@/lib/vercel`
- `Octokit` from `@octokit/rest`

Add import:
- `uploadPortfolio` from `@/lib/portfolio/storage`

Remove from `event.data` destructuring:
- `githubRepoFullName`
- `adminUserId`

Simplify `load-data` step:
- Only select from user: `name`, `subdomain` (remove `vercelProjectId`, `githubRepoFullName`, `githubRepoId`)
- Remove ALL GitHub token resolution logic (service token, admin fallback, Octokit)
- Return only: `{ questionnaire, user }` — no `githubToken`, `githubUsername`, `repoFullName`

Remove these steps entirely:
- `update-status-pushing` + `push-to-github` (all GitHub logic)
- `update-status-deploying` + `deploy-to-vercel` (all Vercel logic)

Replace with single new step `upload-and-activate`:
```typescript
await step.run("upload-and-activate", async () => {
  // Upload to Blob
  const result = await uploadPortfolio(
    data.user.subdomain!,
    generationResult.files
  );

  // Activate site and mark generation complete
  await db
    .update(users)
    .set({ siteEnabled: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await updateStatus({
    status: "completed",
    filesGenerated: generationResult.files.length,
    previewUrl: `https://${data.user.subdomain}.ugc.community`,
    completedAt: new Date(),
  });

  return {
    deploymentUrl: `https://${data.user.subdomain}.ugc.community`,
    previewUrl: `https://${data.user.subdomain}.ugc.community`,
    filesUploaded: result.filesUploaded,
  };
});
```

The `mark-complete` step can be removed since `upload-and-activate` handles it.

Keep the error handling `catch` block (but note it no longer needs GitHub/Vercel-specific error handling).

#### 5c. Edit `lib/inngest/client.ts` — Update event type

Remove `githubRepoFullName` and `adminUserId` from the event type:

```typescript
"portfolio/generate.requested": {
  data: {
    generationId: string;
    questionnaireId: string;
    userId: string;
  };
};
```

#### 5d. Edit `app/api/admin/questionnaires/[id]/generate/route.ts`

- **Remove** the admin GitHub token validation block (Step 2: the `adminUser` query, the `githubAccessToken` / `githubUsername` check, and the 400 error response)
- **Remove** `adminUserId: session.user.id` from the `inngest.send()` data payload
- The route still requires admin auth — just no longer needs the admin to have GitHub connected

#### 5e. Edit `app/api/onboarding/route.ts`

This is the user-facing onboarding endpoint that creates the GitHub repo before dispatching to Inngest. Major simplification:

- **Remove** all GitHub imports: `Octokit`, `createPortfolioRepo`, `waitForRepoInitialized`, `repoExists`
- **Remove** `githubRepoFullName` from the user select query
- **Remove** the entire GitHub repo creation block (the `try/catch` that creates/verifies the repo, ~40 lines)
- **Remove** `githubRepoFullName: repoFullName || undefined` from the `inngest.send()` data
- **Remove** `githubRepo: repoFullName` from the `portfolioGenerations` insert values
- The route simplifies to: validate subdomain → save questionnaire → create generation record → dispatch to Inngest

### Phase 6: Simplify portfolio enforcement cron

Edit `app/api/cron/portfolio-enforcement/route.ts`:

#### What to remove
- **Remove** imports: `addDomain`, `removeDomain`, `VercelApiError` from `@/lib/vercel`
- **Remove** `vercelProjectId` from the creator select query
- **Remove** `vercelProjectId` from the `CreatorRow` type
- **Remove** the `addDomain()` call in the enable path (inside `enforceCreator` when `shouldBeActive && !creator.siteEnabled`)
- **Remove** the `removeDomain()` call and its `VercelApiError` 404 catch in the disable path (inside `enforceCreator` when `!shouldBeActive && creator.siteEnabled`)

#### What to change
- **Change** the creator query filter from `and(isNotNull(users.subdomain), isNotNull(users.vercelProjectId))` to just `isNotNull(users.subdomain)` — portfolios are now identified by having a subdomain (the blob serving route handles the rest)
- **Remove** the `if (!creator.subdomain || !creator.vercelProjectId) continue;` guard — change to just `if (!creator.subdomain) continue;`
- **Remove** the `const domain = ...` line in `enforceCreator` — no longer needed for API calls

#### What to keep (unchanged)
- CRON_SECRET auth check
- Grace period logic (7-day window)
- `getPostCounts()` function (the efficient batch query)
- Hosting reward bypass (`hostingUnlockedUntil`)
- `shouldBeActive` determination logic
- DB updates: `siteEnabled = true/false` (this is now the ONLY enforcement mechanism — the serving route checks this flag)
- Email notifications: `sendPortfolioDisabledEmail`, `sendPortfolioReenabledEmail`
- Summary response JSON
- Error handling and logging

The enforcement function becomes dramatically simpler: just DB read → decide → DB write → email. No external API calls.

## Key reference files (read these first)

- `lib/portfolio/storage.ts` — The `uploadPortfolio()` function you'll call from the new pipeline (Phase 1, already built)
- `lib/agent/portfolio-generator.ts` — The generator to modify (remove `injectTrackingAndContactForm`, `vercel.json`)
- `lib/inngest/functions/generate-portfolio.ts` — The Inngest function to heavily rewrite
- `lib/inngest/client.ts` — Event type definitions to simplify
- `app/api/admin/questionnaires/[id]/generate/route.ts` — Admin trigger route to simplify
- `app/api/onboarding/route.ts` — User onboarding route to simplify (remove GitHub repo creation)
- `app/api/cron/portfolio-enforcement/route.ts` — Enforcement cron to simplify (remove Vercel API calls)

## What NOT to change yet

- Don't delete `lib/github/push-portfolio.ts` — still needed until Phase 7 migration is complete
- Don't delete `lib/vercel/client.ts` or `lib/vercel/index.ts` — other admin routes may still reference these
- Don't remove DB schema fields (`vercelProjectId`, `githubRepoFullName`, etc.) — that's Phase 9
- Don't modify `lib/portfolio/platform-injections.ts` — it's already correct from Phase 2
- Don't modify the serving route or middleware — they're already correct from Phases 3-4

## Testing notes

After implementing, the full flow should work:
1. User submits onboarding questionnaire → no GitHub repo creation, just dispatches to Inngest
2. Inngest generates portfolio with Claude → uploads to Blob → sets `siteEnabled = true`
3. Visiting `{subdomain}.ugc.community` → middleware rewrites → serving route fetches from Blob → injects platform code → serves
4. Enforcement cron runs → checks posting count → toggles `siteEnabled` in DB → serving route returns 404 for disabled sites

Dev testing: Use `localhost:3000?subdomain=johndoe` to test the serving route locally.
