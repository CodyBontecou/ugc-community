# Brand Job Submission - Implementation Prompt

## Context

You are implementing the Brand Job Submission feature for ugc.community. This enables Brand users to submit their own job listings with admin approval workflow.

## Beads Tickets

Execute these tickets in order (dependencies are already set):

1. **ugc-community-6y5w** - Add pending_review status to job constants
2. **ugc-community-hmp0** - Add brand job query functions
3. **ugc-community-0f67** - Create brand job API routes
4. **ugc-community-lzci** - Modify JobForm for brand context
5. **ugc-community-t0xe** - Create brand job management pages
6. **ugc-community-a8qq** - Add admin approval queue for brand jobs

Parent feature: **ugc-community-ts4u** - Brand Job Submission Feature

## Key Files Reference

### Existing patterns to follow:
- `app/api/brands/saved-creators/route.ts` - Brand API authorization pattern
- `components/jobs/job-form.tsx` - Job form component (will be modified)
- `lib/jobs/constants.ts` - Job status constants
- `lib/jobs/queries.ts` - Job query functions
- `app/(dashboard)/dashboard/admin/jobs/page.tsx` - Admin jobs list pattern
- `lib/hooks/use-brand-user.ts` - Client-side brand detection

### Database schema (already exists):
- `content_jobs` table has `brandId` and `createdBy` fields
- `job_applications` table tracks creator interest

## Implementation Details

### 1. Constants (ugc-community-6y5w)

Update `lib/jobs/constants.ts`:
```typescript
export const JOB_STATUSES = ["draft", "pending_review", "active", "paused", "closed"] as const;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
};
```

Update `components/jobs/job-status-badge.tsx` to add blue styling for pending_review.

### 2. Query Functions (ugc-community-hmp0)

Add to `lib/jobs/queries.ts`:
- `countBrandActiveJobs(brandId: string)` - Count jobs where brandId matches and status in (active, pending_review)
- `listBrandJobs(brandId: string, options?)` - List jobs owned by brand with pagination
- `getBrandJobById(jobId: string, brandId: string)` - Get job with ownership check

### 3. Brand API Routes (ugc-community-0f67)

Create `app/api/brand/jobs/route.ts`:
- GET: List brand's jobs (filter by status, paginate)
- POST: Create job with auto-set brandId, createdBy, enforce 5 job limit

Create `app/api/brand/jobs/[jobId]/route.ts`:
- GET: Job detail with applications
- PATCH: Update (cannot set status to active)
- DELETE: Only draft/pending_review jobs

Create `app/api/brand/jobs/[jobId]/applications/route.ts`:
- GET: List applications with creator info

Authorization pattern:
```typescript
const session = await requireAuth();
const user = await db.query.users.findFirst({
  where: eq(users.id, session.user.id),
  columns: { role: true },
});
if (!user || !isBrand(user.role)) {
  return NextResponse.json({ error: "Only brands can access this" }, { status: 403 });
}
// For [jobId] routes, also verify job.brandId === session.user.id
```

### 4. JobForm Modifications (ugc-community-lzci)

Update `components/jobs/job-form.tsx`:
- Add `context?: "admin" | "brand"` prop
- Add `onSuccess?: () => void` prop
- When context="brand":
  - Hide isFeatured checkbox
  - Show draft/submit toggle instead of full status selector
  - Use `/api/brand/jobs` endpoint
  - Two buttons: "Save Draft" (status=draft) and "Submit for Review" (status=pending_review)

### 5. Brand Pages (ugc-community-t0xe)

Create `app/(dashboard)/dashboard/brand-jobs/page.tsx`:
- Status filter tabs: All, Draft, Pending Review, Active, Closed
- Job table with: title, status, views, applications, created date, actions
- "Post New Job" button (disabled if at limit, show "2 of 5 jobs")
- Actions: Edit, Pause/Resume, Close, Delete (draft/pending only)

Create `app/(dashboard)/dashboard/brand-jobs/new/page.tsx`:
- Header with back button and job limit indicator
- JobForm with context="brand"

Create `app/(dashboard)/dashboard/brand-jobs/[jobId]/page.tsx`:
- Tabs: "Job Details" and "Applications"
- JobForm in edit mode
- Applications list showing creators (name, image, subdomain link, note, date)

### 6. Admin Approval (ugc-community-a8qq)

Update `app/(dashboard)/dashboard/admin/jobs/page.tsx`:
- Add "Pending Review" to status filter tabs
- Show brand badge for brand-submitted jobs

Create `components/jobs/brand-badge.tsx`:
```typescript
export function BrandBadge({ brandName }: { brandName: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      Brand: {brandName}
    </span>
  );
}
```

## Verification Checklist

1. [ ] Brand can create a draft job
2. [ ] Brand can submit job for review (status = pending_review)
3. [ ] Brand sees their jobs at /dashboard/brand-jobs
4. [ ] Brand at limit (5 jobs) cannot create more
5. [ ] Admin sees pending jobs in approval queue
6. [ ] Admin can approve job (change to active)
7. [ ] Approved job appears in creator job directory
8. [ ] Brand can see applications for their active jobs
9. [ ] Brand can pause/close their active jobs
10. [ ] Brand cannot delete active jobs (only draft/pending)

## Instructions

1. Run `bd ready` to see available work
2. Start with ugc-community-6y5w (constants - no dependencies)
3. Use `bd update <id> --status=in_progress` when starting a ticket
4. Use `bd close <id>` when completing a ticket
5. Test each change before moving to the next ticket
6. Run `bd sync` when done with the session
