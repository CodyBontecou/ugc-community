# Brand Job Submission - Planning Prompt

## Context

We have an existing Content Jobs Directory feature where:
- **Admins** can create and manage job listings at `/dashboard/admin/jobs`
- **Creators** can browse active jobs at `/dashboard/jobs` and click "I'm Interested" to apply
- Jobs have: title, description, video hooks/ideas, compensation type, niches, platforms, deadline
- The database already has a `brand_id` field on `content_jobs` table (currently NULL for admin-created jobs)

## Goal

Enable **Brand users** to submit their own job listings. This creates a self-service model where brands can post content opportunities directly, reducing admin overhead and scaling the marketplace.

## Key Questions to Answer

### 1. Approval Workflow
- Should brand-submitted jobs go live immediately or require admin approval?
- If approval required, what's the review workflow? (admin dashboard queue?)
- Should brands be able to edit jobs after submission? After approval?

### 2. Monetization
- Is job posting free or paid?
- If paid: flat fee per listing? Subscription tiers? Featured placement upsell?
- Do we integrate with Stripe or handle payment separately?

### 3. Brand Experience
- Where does the "Post a Job" flow live? (`/dashboard/jobs/new` for brands?)
- Can brands see applications/interested creators for their jobs?
- Can brands message or contact interested creators directly?
- Should brands see analytics on their job listings (views, applications)?

### 4. Job Differences
- Are brand jobs visually distinguished from ugc.community jobs?
- Do brand jobs show the brand name/logo?
- Any fields that only apply to brand jobs vs admin jobs?

### 5. Limits & Moderation
- Max active jobs per brand?
- Content moderation on job descriptions?
- Ability to report/flag inappropriate jobs?

## Existing Infrastructure

### Database Schema (already exists)
```sql
-- content_jobs table has:
brand_id TEXT REFERENCES users(id) -- NULL = ugc.community job, set = brand job
created_by TEXT -- who created it (admin or brand user)
status TEXT -- draft | active | paused | closed
```

### Current Routes
- `GET /api/jobs` - List active jobs (creator view)
- `GET /api/jobs/[jobId]` - Job detail
- `POST /api/jobs/[jobId]/apply` - Creator applies
- `GET/POST /api/admin/jobs` - Admin CRUD
- `GET/PATCH/DELETE /api/admin/jobs/[jobId]` - Admin job management

### Brand Detection
- `lib/roles/index.ts` has `isBrand(role)` helper
- `useBrandUser()` hook for client components
- Brand dashboard already exists at `/dashboard` with brand-specific content

## Suggested Implementation Phases

### Phase 1: Brand Job Submission (MVP)
- Add "Post a Job" page for brands at `/dashboard/jobs/new`
- Brand can create jobs (goes to `pending_review` status)
- Admin sees pending jobs in admin dashboard
- Admin approves → job goes active

### Phase 2: Brand Job Management
- Brands can view their submitted jobs
- Brands can edit draft/pending jobs
- Brands can pause/close their active jobs
- Brands see list of interested creators

### Phase 3: Brand-Creator Communication
- Brands can view creator profiles who applied
- Contact/message flow between brand and creator

### Phase 4: Monetization (if applicable)
- Stripe integration for paid job postings
- Featured job placement option
- Analytics dashboard for brands

## Files Likely to Change

```
app/(dashboard)/dashboard/
  jobs/                        # May need brand-specific routing
    new/page.tsx               # NEW: Brand job creation form
    manage/page.tsx            # NEW: Brand's job management
    [jobId]/
      applications/page.tsx    # NEW: View applications (brand only)

app/api/
  brands/
    jobs/
      route.ts                 # NEW: Brand job CRUD
      [jobId]/route.ts         # NEW: Brand job management

lib/jobs/
  constants.ts                 # Add pending_review status?
  queries.ts                   # Add brand-specific queries
```

## Output Expected

1. Answers to the key questions above
2. Detailed implementation plan with phases
3. Database changes needed (if any)
4. API route specifications
5. UI/UX flow descriptions
6. Beads tickets for tracking work

---

## Instructions

Enter plan mode and:
1. Review the existing jobs implementation to understand current patterns
2. Propose answers to the key questions (make recommendations)
3. Design the implementation approach
4. Create beads tickets for the work
