# Begin Major Platform Refactor

## Context

We're executing a major refactor to simplify the ugc-community platform. This work is tracked in beads under epic `ugc-community-71eb`.

## Safety Requirements

**CRITICAL**: All work MUST happen on isolated branches:
- Git branch: `refactor/strip-features`
- Neon DB branch: `refactor-strip-features`

**NEVER** modify production database or main branch directly during this refactor.

## Your Task

Begin the refactor by completing the setup task `ugc-community-a4n3`, then proceed through the dependency chain.

### Step 1: Setup Environment

```bash
# Mark task as in progress
bd update ugc-community-a4n3 --status in_progress

# Create git branch
git checkout main
git pull origin main
git checkout -b refactor/strip-features
```

For Neon DB: I need you to create a branch named `refactor-strip-features` from the production branch in the Neon console, then provide me the connection string to update `.env.local`.

### Step 2: After Setup Complete

Once environment is verified working:
```bash
bd close ugc-community-a4n3
bd ready  # See next available tasks
```

### Step 3: Execute Feature Removals

Work through the feature removal tasks. These can be done in parallel:
- `ugc-community-rq63`: Remove Invite-Only System
- `ugc-community-fh4r`: Remove Portfolio Projects Feature
- `ugc-community-fc6e`: Remove Hashtag Monitoring System
- `ugc-community-cbna`: Remove Creator Directory UI
- `ugc-community-1ffi`: Remove Jobs System Entirely
- `ugc-community-qk8o`: Remove Brand Features
- `ugc-community-4sik`: Remove In-App Notifications
- `ugc-community-qf9p`: Remove Waitlist System

For each task:
1. `bd show <task-id>` to see detailed instructions
2. `bd update <task-id> --status in_progress`
3. Complete the work
4. `bd close <task-id>`

### Step 4: Database Migration

After ALL removal tasks complete:
- `ugc-community-4zba`: Create consolidated database migration

### Step 5: Cleanup

- `ugc-community-tabt`: Remove dead code and unused dependencies
- `ugc-community-l2w0`: Clean up Inngest functions and cron jobs

### Step 6: Final Merge

- `ugc-community-siko`: Merge to production (includes QA checklist)

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

## Commands Reference

```bash
bd ready                    # Show tasks ready to work on
bd show <id>               # View task details
bd update <id> --status in_progress  # Start working
bd close <id>              # Complete task
bd graph ugc-community-71eb  # View dependency graph
bd blocked                 # See what's blocked and why
```

## Verification

Before closing any task, ensure:
1. `npm run build` passes
2. No TypeScript errors
3. App runs locally without console errors
4. Related functionality is fully removed

## Begin

Start by setting up the environment. Run `bd show ugc-community-a4n3` for detailed setup instructions.
