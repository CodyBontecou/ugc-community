# Portfolio Website Generator - Implementation Prompt

## Overview

Build an admin feature that generates portfolio websites from creator questionnaire submissions using Claude Code's Agent SDK. When an admin clicks "Generate Website" on a questionnaire, the system should:

1. Use Claude Agent SDK to generate a complete Next.js portfolio
2. Research the creator's inspiring brands via web search
3. Apply high-quality frontend design principles
4. Push the generated code to GitHub
5. Trigger Vercel deployment to the creator's subdomain

## Beads Epic

- **Epic**: `ugc-community-44u4` - Portfolio Website Generator - Admin Tool
- Run `bd show ugc-community-44u4` for full details
- Run `bd ready` to see available tasks

## Existing Infrastructure

### Questionnaire System
- **Schema**: `lib/db/schema.ts` (lines 140-157) - `onboardingQuestionnaires` table
- **Fields**: `portfolioVision` (required), `inspiringBrands`, `portfolioExamples`
- **Admin API**: `app/api/admin/questionnaires/route.ts` - fetches all questionnaires with user data
- **Admin UI**: `app/(dashboard)/dashboard/admin/questionnaires/page.tsx`

### GitHub Integration (Already Built)
- **OAuth Flow**: `app/api/admin/github/connect/route.ts` - admin connects GitHub
- **Repo Listing**: `app/api/admin/github/repos/route.ts` - list admin's repos
- **User Fields**: `githubAccessToken`, `githubUsername`, `githubRepoFullName`, `githubRepoId`

### Vercel Integration (Already Built)
- **Client**: `lib/vercel/client.ts` - full API wrapper
- **Functions**: `createProject()`, `addDomain()`, `linkGitHubRepo()`, `createDeployment()`
- **User Fields**: `vercelProjectId`, `subdomain`, `siteEnabled`
- **Existing Endpoints**:
  - `app/api/admin/creators/[userId]/link-repo/route.ts` - links GitHub repo to Vercel
  - `app/api/admin/creators/[userId]/deployments/route.ts` - triggers deployments

### Anthropic SDK
- **Package**: `@anthropic-ai/sdk` already installed
- **Env Var**: `ANTHROPIC_API_KEY` configured

## Tasks to Implement

### Phase 1: Foundation (Can Work in Parallel)

#### 1. Configure Claude Agent SDK (`ugc-community-mt2o`)
Create `lib/agent/portfolio-generator.ts`:

```typescript
import { query, ClaudeAgentOptions } from '@anthropic-ai/claude-code'

export interface GenerationResult {
  files: Array<{ path: string; content: string }>
  success: boolean
  error?: string
}

export async function generatePortfolio(
  questionnaire: QuestionnaireData,
  outputDir: string
): Promise<GenerationResult> {
  const options: ClaudeAgentOptions = {
    cwd: outputDir,
    allowedTools: ['Write', 'WebSearch', 'Read', 'Glob'],
    permissionMode: 'acceptEdits',
    maxTurns: 25,
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: getSystemPromptAppend()
    }
  }

  // Implementation...
}
```

#### 2. Build Prompt Template (`ugc-community-h6ha`)
Create `lib/agent/portfolio-prompt.ts`:

```typescript
export function buildPortfolioPrompt(data: {
  portfolioVision: string
  inspiringBrands: string | null
  portfolioExamples: string | null
  creatorName: string
  subdomain: string
}): string {
  return `
Generate a complete, production-ready portfolio website for ${data.creatorName}.

## Creator's Vision
${data.portfolioVision}

## Research Phase
${data.inspiringBrands ? `Use WebSearch to research these inspiring brands and incorporate their design patterns: ${data.inspiringBrands}` : ''}
${data.portfolioExamples ? `Reference these portfolio examples for inspiration: ${data.portfolioExamples}` : ''}

## Technical Requirements
- Framework: Next.js 14 with App Router
- Styling: Tailwind CSS
- Language: TypeScript
- Responsive: Mobile-first design
- Performance: Optimized images, minimal JS

## Required Files
Generate these files:
- app/layout.tsx (root layout with metadata)
- app/page.tsx (homepage)
- app/globals.css (Tailwind imports + custom styles)
- components/Hero.tsx
- components/Portfolio.tsx (work showcase grid)
- components/About.tsx
- components/Contact.tsx
- tailwind.config.ts
- package.json
- next.config.js
- tsconfig.json
- README.md

## Design Guidelines
- Create a DISTINCTIVE design - avoid generic templates
- Use the creator's vision to guide color palette and typography
- Include smooth animations and micro-interactions
- Ensure WCAG 2.1 AA accessibility
- Design should feel premium and professional

The site will be deployed to: https://${data.subdomain}.ugc.community
`
}
```

#### 3. Create GitHub Push Helper (`ugc-community-4mre`)
Create `lib/github/push-portfolio.ts`:

```typescript
import { Octokit } from '@octokit/rest'

export async function createPortfolioRepo(
  octokit: Octokit,
  username: string
): Promise<{ repoFullName: string; repoUrl: string }> {
  const repoName = `${username}-portfolio`
  // Create repo via GitHub API
}

export async function pushFilesToRepo(
  octokit: Octokit,
  repoFullName: string,
  files: Array<{ path: string; content: string }>,
  commitMessage: string
): Promise<{ commitSha: string }> {
  // Use GitHub Contents API or create tree + commit
}
```

### Phase 2: CLI Script (`ugc-community-8spr`)
Create `scripts/generate-portfolio.ts`:

```typescript
#!/usr/bin/env tsx
import { db } from '@/lib/db'
import { generatePortfolio } from '@/lib/agent/portfolio-generator'
import { buildPortfolioPrompt } from '@/lib/agent/portfolio-prompt'
import { pushFilesToRepo } from '@/lib/github/push-portfolio'

const questionnaireId = process.argv[2]
if (!questionnaireId) {
  console.error('Usage: pnpm tsx scripts/generate-portfolio.ts <questionnaire-id>')
  process.exit(1)
}

async function main() {
  // 1. Load questionnaire and user data
  // 2. Generate portfolio with Claude
  // 3. Push to GitHub
  // 4. Trigger Vercel deployment
}

main()
```

### Phase 3: API Endpoint (`ugc-community-10p6`)
Create `app/api/admin/questionnaires/[id]/generate/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { generatePortfolio } from '@/lib/agent/portfolio-generator'
import { pushFilesToRepo } from '@/lib/github/push-portfolio'
import { vercelClient } from '@/lib/vercel'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Validate admin access
  // 2. Load questionnaire + user
  // 3. Generate portfolio
  // 4. Push to GitHub
  // 5. Link to Vercel + deploy
  // 6. Return result
}
```

### Phase 4: UI Button (`ugc-community-e381`)
Update `app/(dashboard)/dashboard/admin/questionnaires/page.tsx`:

```typescript
// Add to each questionnaire card
<Button
  onClick={() => handleGenerate(questionnaire.id)}
  disabled={generating === questionnaire.id}
>
  {generating === questionnaire.id ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generating...
    </>
  ) : (
    'Generate Website'
  )}
</Button>
```

## Environment Variables Needed

```bash
# Already configured
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
VERCEL_API_TOKEN=...
VERCEL_TEAM_ID=...
```

## Testing Strategy

1. **Unit Tests**: Prompt template generation
2. **Integration Test**: GitHub push helper with test repo
3. **E2E Test**: Full flow with a test questionnaire

## Success Criteria

- [ ] Admin can click "Generate Website" on any questionnaire
- [ ] Claude generates a complete, deployable Next.js portfolio
- [ ] Design reflects creator's vision and brand research
- [ ] Code is automatically pushed to GitHub
- [ ] Vercel deploys to `{subdomain}.ugc.community`
- [ ] Process completes in under 5 minutes
- [ ] Errors are handled gracefully with clear feedback

## Getting Started

```bash
# Check available tasks
bd ready

# Start with the three parallel foundation tasks
bd update ugc-community-mt2o --status=in_progress  # Agent SDK
bd update ugc-community-h6ha --status=in_progress  # Prompt template
bd update ugc-community-4mre --status=in_progress  # GitHub helper

# When complete, mark done
bd close ugc-community-mt2o ugc-community-h6ha ugc-community-4mre
```
