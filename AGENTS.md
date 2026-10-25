# Agent Instructions

## Preserve the pink gradient buttons

- Keep the user-approved coral-to-rose pink gradient on primary buttons, including `.primary-action` in `app/globals.css` and its shared color tokens. Change this appearance only when the user explicitly requests a button redesign.
- Performance, Lighthouse, and accessibility updates must preserve this gradient. Report any contrast findings as follow-up work rather than replacing or darkening the gradient to improve audit scores.
- Before deploying performance changes, verify that Browse jobs, Search jobs, and Apply still render the pink gradient on the job board; verify the same buttons on the live site after deployment.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Use `list_todos` to review open items; create new todos for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
4. **Clean up** - Clear stashes, prune remote branches
5. **Verify** - All changes committed AND pushed
6. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
