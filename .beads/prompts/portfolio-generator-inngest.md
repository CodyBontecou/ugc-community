# Portfolio Website Generator - Inngest Background Processing

## Overview

Phase 1 implemented the core portfolio generation flow. Phase 2 Task 1 added database status tracking. Now we need to move the actual generation work to a background job to avoid Vercel serverless function timeouts (generation takes 1-5 minutes).

**Beads Task**: `ugc-community-uih0` - Integrate background job processing for generation

## Current Implementation

### Status Tracking (Already Implemented)
- `portfolio_generations` table tracks status: pending → generating → pushing → deploying → completed/failed
- `POST /api/admin/questionnaires/[id]/generate` creates record and updates status throughout
- `GET /api/admin/questionnaires/[id]/generate/status` returns latest generation status
- UI polls for status updates every 2 seconds

### Problem
The generate endpoint currently runs everything synchronously:
```
POST /generate
  → Create generation record (fast)
  → generatePortfolio() with Claude (1-3 min) ← TIMEOUT RISK
  → pushFilesToRepo() to GitHub (30s)
  → createDeployment() to Vercel (30s)
  → Return result
```

### Solution
Move the slow work to an Inngest background function:
```
POST /generate
  → Create generation record (fast)
  → Dispatch Inngest event (fast)
  → Return { generationId, status: "pending" }

Inngest function (runs in background):
  → Step 1: Update status to "generating"
  → Step 2: Generate portfolio with Claude
  → Step 3: Update status to "pushing", push to GitHub
  → Step 4: Update status to "deploying", deploy to Vercel
  → Step 5: Update status to "completed"
```

## Implementation Steps

### 1. Install Inngest

```bash
pnpm add inngest
```

### 2. Create Inngest Client

```typescript
// lib/inngest/client.ts
import { Inngest, EventSchemas } from "inngest";

// Define event types for type safety
type Events = {
  "portfolio/generate.requested": {
    data: {
      generationId: string;
      questionnaireId: string;
      userId: string;
      adminUserId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "ugc-community",
  schemas: new EventSchemas().fromRecord<Events>(),
});
```

### 3. Create Generation Function

```typescript
// lib/inngest/functions/generate-portfolio.ts
import { inngest } from "../client";
import { db } from "@/lib/db";
import { portfolioGenerations, users, onboardingQuestionnaires } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generatePortfolio } from "@/lib/agent/portfolio-generator";
import { QuestionnaireData } from "@/lib/agent/portfolio-prompt";
import {
  createPortfolioRepo,
  pushFilesToRepo,
  repoExists,
  getRepoInfo,
} from "@/lib/github/push-portfolio";
import {
  createProject,
  addDomain,
  linkGitHubRepo,
  createDeployment,
} from "@/lib/vercel";
import { Octokit } from "@octokit/rest";

export const generatePortfolioFunction = inngest.createFunction(
  {
    id: "generate-portfolio",
    retries: 1, // Only retry once - generation is expensive
  },
  { event: "portfolio/generate.requested" },
  async ({ event, step }) => {
    const { generationId, questionnaireId, userId, adminUserId } = event.data;

    // Helper to update generation status
    const updateStatus = async (updates: Record<string, unknown>) => {
      await db
        .update(portfolioGenerations)
        .set(updates)
        .where(eq(portfolioGenerations.id, generationId));
    };

    try {
      // Step 1: Load data and validate
      const data = await step.run("load-data", async () => {
        const [questionnaire] = await db
          .select({
            portfolioVision: onboardingQuestionnaires.portfolioVision,
            inspiringBrands: onboardingQuestionnaires.inspiringBrands,
            portfolioExamples: onboardingQuestionnaires.portfolioExamples,
          })
          .from(onboardingQuestionnaires)
          .where(eq(onboardingQuestionnaires.id, questionnaireId));

        const [user] = await db
          .select({
            name: users.name,
            subdomain: users.subdomain,
            vercelProjectId: users.vercelProjectId,
            githubRepoFullName: users.githubRepoFullName,
            githubRepoId: users.githubRepoId,
          })
          .from(users)
          .where(eq(users.id, userId));

        const [admin] = await db
          .select({
            githubAccessToken: users.githubAccessToken,
            githubUsername: users.githubUsername,
          })
          .from(users)
          .where(eq(users.id, adminUserId));

        if (!questionnaire || !user || !admin?.githubAccessToken) {
          throw new Error("Missing required data");
        }

        return { questionnaire, user, admin };
      });

      // Step 2: Generate portfolio with Claude
      await step.run("update-status-generating", async () => {
        await updateStatus({ status: "generating" });
      });

      const generationResult = await step.run("generate-with-claude", async () => {
        const questionnaireData: QuestionnaireData = {
          portfolioVision: data.questionnaire.portfolioVision,
          inspiringBrands: data.questionnaire.inspiringBrands,
          portfolioExamples: data.questionnaire.portfolioExamples,
          creatorName: data.user.name,
          subdomain: data.user.subdomain!,
        };

        const result = await generatePortfolio(questionnaireData);
        if (!result.success) {
          throw new Error(result.error || "Generation failed");
        }
        return result;
      });

      // Step 3: Push to GitHub
      await step.run("update-status-pushing", async () => {
        await updateStatus({
          status: "pushing",
          filesGenerated: generationResult.files.length,
        });
      });

      const githubResult = await step.run("push-to-github", async () => {
        const octokit = new Octokit({ auth: data.admin.githubAccessToken });
        const repoName = `${data.user.subdomain}-portfolio`;
        let repoFullName = data.user.githubRepoFullName;
        let repoId = data.user.githubRepoId;

        if (!repoFullName) {
          const expectedRepoName = `${data.admin.githubUsername}/${repoName}`;
          const exists = await repoExists(octokit, expectedRepoName);

          if (exists) {
            repoFullName = expectedRepoName;
            const repoInfo = await getRepoInfo(octokit, expectedRepoName);
            repoId = String(repoInfo.id);
          } else {
            const createResult = await createPortfolioRepo(
              octokit,
              data.user.subdomain!,
              {
                description: `Portfolio website for ${data.user.name}`,
                isPrivate: false,
              }
            );
            repoFullName = createResult.repoFullName;
            repoId = String(createResult.repoId);
          }

          // Update user with repo info
          await db
            .update(users)
            .set({
              githubRepoFullName: repoFullName,
              githubRepoId: repoId,
            })
            .where(eq(users.id, userId));
        }

        // Push files
        await pushFilesToRepo(
          octokit,
          repoFullName,
          generationResult.files,
          "feat: portfolio generated by UGC Community"
        );

        await updateStatus({ githubRepo: repoFullName });

        return { repoFullName, repoId };
      });

      // Step 4: Deploy to Vercel
      await step.run("update-status-deploying", async () => {
        await updateStatus({ status: "deploying" });
      });

      const deployResult = await step.run("deploy-to-vercel", async () => {
        let vercelProjectId = data.user.vercelProjectId;

        if (!vercelProjectId) {
          const vercelProject = await createProject({
            name: `${data.user.subdomain}-portfolio`,
            framework: "nextjs",
            gitRepository: {
              type: "github",
              repo: githubResult.repoFullName,
            },
          });
          vercelProjectId = vercelProject.id;

          const domain = `${data.user.subdomain}.ugc.community`;
          await addDomain(vercelProjectId, domain);

          await db
            .update(users)
            .set({
              vercelProjectId,
              siteEnabled: true,
            })
            .where(eq(users.id, userId));
        } else {
          await linkGitHubRepo(vercelProjectId, githubResult.repoFullName);
        }

        const deployment = await createDeployment(vercelProjectId, {
          target: "production",
          gitSource: {
            type: "github",
            ref: "main",
            repoId: githubResult.repoId!,
          },
        });

        return {
          deploymentUrl: `https://${deployment.url}`,
          previewUrl: `https://${data.user.subdomain}.ugc.community`,
        };
      });

      // Step 5: Mark complete
      await step.run("mark-complete", async () => {
        await updateStatus({
          status: "completed",
          deploymentUrl: deployResult.deploymentUrl,
          previewUrl: deployResult.previewUrl,
          completedAt: new Date(),
        });
      });

      return { success: true, ...deployResult };
    } catch (error) {
      // Mark as failed
      await updateStatus({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorStep: "inngest",
        completedAt: new Date(),
      });
      throw error;
    }
  }
);
```

### 4. Create Inngest API Route

```typescript
// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generatePortfolioFunction } from "@/lib/inngest/functions/generate-portfolio";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generatePortfolioFunction],
});
```

### 5. Update Generate Endpoint

Simplify the POST endpoint to just create record and dispatch event:

```typescript
// app/api/admin/questionnaires/[id]/generate/route.ts
export async function POST(request, { params }) {
  // ... validation (keep existing) ...

  // Create generation record
  const [generation] = await db
    .insert(portfolioGenerations)
    .values({
      userId: q.userId,
      questionnaireId,
      status: "pending",
    })
    .returning();

  // Dispatch to Inngest
  await inngest.send({
    name: "portfolio/generate.requested",
    data: {
      generationId: generation.id,
      questionnaireId,
      userId: q.userId,
      adminUserId: session.user.id,
    },
  });

  return NextResponse.json({
    success: true,
    generationId: generation.id,
    status: "pending",
    message: "Generation started. Check status for updates.",
  });
}
```

### 6. Environment Variables

Add to `.env.local`:
```bash
# Inngest (get from https://app.inngest.com)
INNGEST_EVENT_KEY=<your-event-key>
INNGEST_SIGNING_KEY=<your-signing-key>
```

For local development, the Inngest dev server handles this automatically.

## Testing

### Local Development

1. Start the Inngest dev server:
```bash
npx inngest-cli@latest dev
```

2. Start your Next.js dev server:
```bash
pnpm dev
```

3. Open http://localhost:8288 to see the Inngest dashboard

4. Trigger a generation from the admin UI and watch the function execute

### Verifying Steps

The Inngest dashboard shows:
- Each step's execution time
- Status updates in real-time
- Error details if any step fails
- Retry behavior

## Files to Create/Modify

```
lib/inngest/
  client.ts              # Inngest client configuration
  functions/
    generate-portfolio.ts # Background generation function

app/api/inngest/
  route.ts               # Inngest webhook handler

app/api/admin/questionnaires/[id]/generate/
  route.ts               # Simplify to dispatch event only
```

## Success Criteria

- [ ] Inngest client and function created
- [ ] API route for Inngest webhook working
- [ ] Generate endpoint dispatches event instead of running synchronously
- [ ] Status updates appear in UI during background processing
- [ ] Function retries once on failure
- [ ] Errors are captured in generation record
- [ ] Local dev server (npx inngest-cli dev) works
- [ ] No Vercel timeout errors in production

## Getting Started

```bash
# Claim the task
bd update ugc-community-uih0 --status=in_progress

# Install Inngest
pnpm add inngest

# Create the files as described above

# Test locally
npx inngest-cli@latest dev

# When complete
bd close ugc-community-uih0
```
