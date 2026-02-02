# Major Platform Refactor - Autonomous Execution

## Mission

Execute the complete platform refactor tracked in epic `ugc-community-71eb`. **Do NOT stop until all tasks are closed and the refactor is merged to production.**

Work autonomously through the entire dependency chain. Only pause for explicit user input when absolutely required (e.g., Neon console access, production credentials).

## Safety Requirements

**CRITICAL**: All work MUST happen on isolated branches:
- Git branch: `refactor/strip-features`
- Neon DB branch: `refactor-strip-features`

**NEVER** modify production database or main branch until the final merge task.

## Execution Protocol

### Phase 1: Environment Setup (`ugc-community-a4n3`)

```bash
bd update ugc-community-a4n3 --status in_progress
git checkout main && git pull origin main
git checkout -b refactor/strip-features
```

**REQUIRES USER INPUT**: Ask the user to:
1. Create Neon branch `refactor-strip-features` from production
2. Provide the new connection string

Once received, update `.env.local` with the new DATABASE_URL, verify the app runs, then:
```bash
bd close ugc-community-a4n3
```

### Phase 2: Feature Removal (Parallel Execution)

Execute ALL of these tasks. After closing each one, immediately proceed to the next:

| Task ID | Description |
|---------|-------------|
| `ugc-community-rq63` | Remove Invite-Only System |
| `ugc-community-fh4r` | Remove Portfolio Projects Feature |
| `ugc-community-fc6e` | Remove Hashtag Monitoring System |
| `ugc-community-cbna` | Remove Creator Directory UI |
| `ugc-community-1ffi` | Remove Jobs System Entirely |
| `ugc-community-qk8o` | Remove Brand Features |
| `ugc-community-4sik` | Remove In-App Notifications |
| `ugc-community-qf9p` | Remove Waitlist System |

Also complete these update tasks:
| `ugc-community-eq5i` | Update Public Pages After Refactor |
| `ugc-community-qzpf` | Update Admin Panel After Refactor |
| `ugc-community-vy8j` | Evaluate Cloudflare R2 vs Vercel Blob |

**For each task:**
1. `bd update <id> --status in_progress`
2. `bd show <id>` - read the detailed instructions
3. Execute ALL file deletions and modifications listed
4. Verify no TypeScript errors: `npx tsc --noEmit`
5. Commit changes: `git add -A && git commit -m "<task title>"`
6. `bd close <id>`
7. **Immediately continue to next task** - do NOT wait for user input

### Phase 3: Database Migration (`ugc-community-4zba`)

Blocked until ALL Phase 2 removal tasks are closed. Then:

1. `bd update ugc-community-4zba --status in_progress`
2. Update `lib/db/schema.ts` - remove all dropped tables
3. Generate migration: `npm run db:generate`
4. Apply to Neon branch: `npm run db:migrate`
5. Verify app still works
6. Commit and `bd close ugc-community-4zba`

### Phase 4: Cleanup

| Task ID | Description |
|---------|-------------|
| `ugc-community-l2w0` | Remove Dead Inngest Functions and Cron Jobs |
| `ugc-community-tabt` | Clean Up Dead Code and Unused Dependencies |

After completing:
```bash
npm run build  # Must pass with zero errors
```

### Phase 5: Production Merge (`ugc-community-siko`)

**REQUIRES USER INPUT**: Before merging, ask user to confirm:
1. They've tested the app on the Neon branch
2. They approve the merge to production

Then:
```bash
git checkout main
git pull origin main
git merge refactor/strip-features
git push origin main
bd close ugc-community-siko
bd close ugc-community-71eb  # Close the epic
```

## Features Being REMOVED

- Invite-only authentication system
- Portfolio projects (keeping media upload for AI generation)
- Hashtag monitoring webhooks
- Creator directory UI (public /creators pages)
- Jobs system (listings, applications, brand jobs)
- Brand features (saved creators, brand dashboard)
- In-app notifications (keeping email notifications)
- Waitlist system

## Features Being KEPT

- User authentication (email/password, OAuth)
- User profiles
- AI portfolio generation & Vercel deployment
- Media upload & management
- Milestones & rewards system
- Analytics & view tracking
- Post tracking (manual, without hashtag monitoring)
- Email notifications
- Core admin features
- Public landing pages
- Background job infrastructure

## Working Rules

1. **DO NOT STOP** between tasks - immediately proceed to the next available task
2. **Commit frequently** - after each task completion at minimum
3. **Run `bd ready`** after each task to see what's unblocked
4. **Run `npx tsc --noEmit`** after significant changes to catch errors early
5. **If a build fails**, fix it before proceeding - do not leave broken state
6. **Push to remote regularly**: `git push origin refactor/strip-features`
7. **Only ask for user input** when explicitly marked as REQUIRES USER INPUT

## Progress Tracking

After completing each task, output:
```
✓ Closed <task-id>: <task-title>
→ Next: <next-task-id>: <next-task-title>
→ Remaining: <count> tasks
```

Check overall progress:
```bash
bd children ugc-community-71eb  # Shows all tasks and their status
```

## Error Recovery

If something breaks:
1. Do NOT stop - fix it
2. If you can't fix it, document the issue in a comment: `bd comments <task-id> add "Error: <description>"`
3. Continue with other tasks if possible
4. Only escalate to user if completely blocked

## Begin Now

Start executing. First task: `ugc-community-a4n3` (Setup Refactor Development Environment)

Run `bd update ugc-community-a4n3 --status in_progress` and begin.
