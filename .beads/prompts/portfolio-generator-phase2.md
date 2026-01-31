# Portfolio Website Generator - Phase 2: Production Enhancements

## Overview

Phase 1 of the Portfolio Website Generator is complete. The core flow works:
1. Admin clicks "Generate Website" on a questionnaire
2. Claude generates portfolio files
3. Files are pushed to GitHub
4. Vercel deploys to creator's subdomain

**Problem:** The current implementation runs synchronously in the API endpoint, which can timeout on Vercel's serverless functions (generation takes 1-5 minutes).

**Phase 2 Goal:** Add background job processing and status tracking to make the feature production-ready.

## Beads Tasks

- **Epic**: `ugc-community-44u4` - Portfolio Website Generator (still open)
- **Task 1**: `ugc-community-wwpd` - Add generation status tracking to database
- **Task 2**: `ugc-community-uih0` - Integrate background job processing

Run `bd ready` to see available tasks.

## Existing Implementation

### Current Files
```
lib/agent/portfolio-generator.ts    # Claude SDK integration
lib/agent/portfolio-prompt.ts       # Prompt template builder
lib/github/push-portfolio.ts        # GitHub API helpers
scripts/generate-portfolio.ts       # CLI testing script
app/api/admin/questionnaires/[id]/generate/route.ts  # API endpoint
app/(dashboard)/dashboard/admin/questionnaires/page.tsx  # UI with button
```

### Current Flow
```
POST /api/admin/questionnaires/[id]/generate
  → generatePortfolio() (Claude API calls)
  → pushFilesToRepo() (GitHub API)
  → createProject/linkGitHubRepo() (Vercel API)
  → createDeployment() (Vercel API)
  → Return result
```

## Task 1: Database Status Tracking (`ugc-community-wwpd`)

### Schema Design
Create a new `portfolio_generations` table to track generation history:

```typescript
// Add to lib/db/schema.ts
export const portfolioGenerations = pgTable(
  "portfolio_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionnaireId: uuid("questionnaire_id")
      .references(() => onboardingQuestionnaires.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"),
    // Status values: 'pending', 'generating', 'pushing', 'deploying', 'completed', 'failed'
    githubRepo: text("github_repo"),
    deploymentUrl: text("deployment_url"),
    previewUrl: text("preview_url"),
    filesGenerated: integer("files_generated"),
    error: text("error"),
    errorStep: text("error_step"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("portfolio_generations_user_id_idx").on(table.userId),
    index("portfolio_generations_status_idx").on(table.status),
  ]
);
```

### Migration
Create `drizzle/0008_add_portfolio_generations.sql`:
```sql
CREATE TABLE IF NOT EXISTS portfolio_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES onboarding_questionnaires(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  github_repo TEXT,
  deployment_url TEXT,
  preview_url TEXT,
  files_generated INTEGER,
  error TEXT,
  error_step TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS portfolio_generations_user_id_idx ON portfolio_generations(user_id);
CREATE INDEX IF NOT EXISTS portfolio_generations_status_idx ON portfolio_generations(status);
```

### API Updates
1. Create generation record at start
2. Update status as each step completes
3. Record errors with step info
4. Add GET endpoint to check status: `GET /api/admin/questionnaires/[id]/generate/status`

### UI Updates
1. Show current generation status on questionnaire cards
2. Poll for status updates while generating
3. Show generation history

## Task 2: Background Job Processing (`ugc-community-uih0`)

### Recommended: Inngest

Inngest provides event-driven background functions with excellent Next.js integration.

### Setup Steps

1. **Install Inngest**
```bash
pnpm add inngest
```

2. **Create Inngest client**
```typescript
// lib/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "ugc-community",
  schemas: new EventSchemas().fromRecord<{
    "portfolio/generate.requested": {
      data: {
        generationId: string;
        questionnaireId: string;
        adminUserId: string;
      };
    };
  }>(),
});
```

3. **Create generation function**
```typescript
// lib/inngest/functions/generate-portfolio.ts
import { inngest } from "../client";
import { db } from "@/lib/db";
import { portfolioGenerations, users, onboardingQuestionnaires } from "@/lib/db/schema";
import { generatePortfolio } from "@/lib/agent/portfolio-generator";
import { pushFilesToRepo, createPortfolioRepo } from "@/lib/github/push-portfolio";
import { Octokit } from "@octokit/rest";
// ... imports

export const generatePortfolioFunction = inngest.createFunction(
  {
    id: "generate-portfolio",
    retries: 1, // Only retry once - generation is expensive
  },
  { event: "portfolio/generate.requested" },
  async ({ event, step }) => {
    const { generationId, questionnaireId, adminUserId } = event.data;

    // Step 1: Update status to 'generating'
    await step.run("update-status-generating", async () => {
      await db
        .update(portfolioGenerations)
        .set({ status: "generating" })
        .where(eq(portfolioGenerations.id, generationId));
    });

    // Step 2: Generate portfolio with Claude
    const result = await step.run("generate-with-claude", async () => {
      // Load questionnaire data...
      // Call generatePortfolio()...
      return result;
    });

    // Step 3: Push to GitHub
    await step.run("push-to-github", async () => {
      await db
        .update(portfolioGenerations)
        .set({ status: "pushing" })
        .where(eq(portfolioGenerations.id, generationId));
      // Push files...
    });

    // Step 4: Deploy to Vercel
    await step.run("deploy-to-vercel", async () => {
      await db
        .update(portfolioGenerations)
        .set({ status: "deploying" })
        .where(eq(portfolioGenerations.id, generationId));
      // Create/update Vercel project...
    });

    // Step 5: Mark complete
    await step.run("mark-complete", async () => {
      await db
        .update(portfolioGenerations)
        .set({
          status: "completed",
          completedAt: new Date(),
          // ... other fields
        })
        .where(eq(portfolioGenerations.id, generationId));
    });
  }
);
```

4. **Create API route for Inngest**
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

5. **Update generate endpoint to dispatch event**
```typescript
// app/api/admin/questionnaires/[id]/generate/route.ts
export async function POST(request, { params }) {
  // ... validation ...

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

### Environment Variables
```bash
# Add to .env.local
INNGEST_EVENT_KEY=<from inngest dashboard>
INNGEST_SIGNING_KEY=<from inngest dashboard>
```

## Updated UI Flow

1. Admin clicks "Generate Website"
2. API creates generation record, dispatches Inngest event
3. UI shows "Generation started..." with generation ID
4. UI polls `GET /api/admin/questionnaires/[id]/generate/status`
5. UI updates: "Generating..." → "Pushing to GitHub..." → "Deploying..." → "Complete!"
6. On complete, show links to site and GitHub repo

## Testing Strategy

1. **Local Development**
   - Run Inngest dev server: `npx inngest-cli@latest dev`
   - Test full flow with real questionnaire
   - Verify status updates in database

2. **Unit Tests**
   - Status tracking CRUD operations
   - Inngest event serialization

3. **Integration Tests**
   - Mock Claude API responses
   - Verify step-by-step status updates

## Getting Started

```bash
# Check available tasks
bd ready

# Start with status tracking (no external dependencies)
bd update ugc-community-wwpd --status=in_progress

# When complete
bd close ugc-community-wwpd

# Then add Inngest
bd update ugc-community-uih0 --status=in_progress
```

## Success Criteria

- [ ] Generation status visible in UI
- [ ] No API timeouts - work runs in background
- [ ] Can view generation history for each user
- [ ] Failures are logged with step info
- [ ] Retries work correctly
- [ ] Local development works with Inngest dev server
