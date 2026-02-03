# Refactor Plan

This document tracks features for the major refactor. Coding agents should read this before making changes.

## Decision Key
- ✅ **KEEP** - Feature stays, may need updates
- ❌ **REMOVE** - Feature should be deleted entirely  
- ⚠️ **SIMPLIFY** - Keep core functionality, remove complexity
- 🔄 **REPLACE** - Swap with different implementation
- ❓ **UNDECIDED** - Needs discussion

## Status Key
- `[ ]` Not started
- `[~]` In progress  
- `[x]` Complete

---

## 1. Authentication & User Management

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Email/Password Auth | ❓ | [ ] | |
| OAuth Integration | ❓ | [ ] | |
| Invite-Only System | ❓ | [ ] | |
| User Roles (Creator/Brand) | ❓ | [ ] | |
| User Status (active/suspended/banned) | ❓ | [ ] | |
| Session Management | ❓ | [ ] | |

**Files affected:**
- `lib/auth/`
- `app/(auth)/`
- `app/api/auth/`
- `app/api/invites/`
- `lib/invites.ts`
- `components/auth/`

---

## 2. User Profiles

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Custom Subdomains | ❓ | [ ] | |
| Profile Information | ❓ | [ ] | |
| Social Links | ❓ | [ ] | |
| Location Data | ❓ | [ ] | |
| Profile Avatar | ❓ | [ ] | |
| Tagline | ❓ | [ ] | |

**Files affected:**
- `app/api/user/profile/`
- `app/api/user/subdomain/`
- `app/api/user/username/`
- `lib/db/schema.ts` (users table)

---

## 3. Portfolio System

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| AI Portfolio Generation | ❌ REMOVE | [x] | Replaced with template-based system |
| Inngest Portfolio Generation | ❌ REMOVE | [x] | No longer needed |
| Claude API Integration | ❌ REMOVE | [x] | No longer needed for portfolios |
| Template-Based Portfolios | ✅ KEEP | [x] | New system using ugc-template/media-kit |
| Onboarding Questionnaire | 🔄 REPLACE | [x] | Updated for template data collection |
| GitHub Integration | ✅ KEEP | [ ] | Used for template deployment |
| Vercel Deployment | ✅ KEEP | [ ] | For portfolio hosting |
| Site Enable/Disable | ❓ | [ ] | |
| Portfolio Projects | ❓ | [ ] | May be deprecated |

**Files affected:**
- `lib/agent/` - ❌ TO REMOVE (legacy AI generation)
- `lib/inngest/functions/generate-portfolio.ts` - ❌ TO REMOVE
- `lib/template/` - ✅ NEW (template-based generation)
- `lib/vercel/` - Keep for deployment
- `lib/github/` - Keep for repo management
- `app/api/onboarding/` - Updated for new schema
- `components/dashboard/onboarding-form.tsx` - Updated for template data

**Migration Notes:**
- Template repo: `ugc-template/media-kit`
- Template populates `lib/data/creator.ts` with user data
- No AI costs, deterministic generation

---

## 4. Media Management

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Media Upload | ❓ | [ ] | Core feature for portfolios |
| WebP Conversion | ❓ | [ ] | |
| Thumbnail Generation | ❓ | [ ] | |
| Video Processing | ❓ | [ ] | Uses ffmpeg, inngest |
| Media Library | ❓ | [ ] | |
| Vercel Blob Storage | ❓ | [ ] | |

**Files affected:**
- `lib/storage/`
- `lib/media/`
- `app/api/media/`
- `lib/inngest/functions/process-video.ts`
- `components/media/`

---

## 5. Milestone & Rewards System

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Monthly Milestones | ❓ | [ ] | |
| Lifetime Milestones | ❓ | [ ] | |
| Hosting Rewards | ❓ | [ ] | |
| Analytics Rewards | ❓ | [ ] | |
| Edit Allowance Rewards | ❓ | [ ] | |
| Directory Boost Rewards | ❓ | [ ] | |
| Badge Rewards | ❓ | [ ] | |
| Progress Tracking UI | ❓ | [ ] | |
| Celebration Toasts | ❓ | [ ] | |

**Files affected:**
- `lib/milestones/`
- `app/api/user/milestones/`
- `app/api/user/rewards/`
- `components/milestones/`

**Dependencies:** Ties into analytics, directory, and hashtag monitoring.

---

## 6. Analytics & Tracking

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Profile View Tracking | ❓ | [ ] | |
| Portfolio View Tracking | ❓ | [ ] | |
| View Deduplication | ❓ | [ ] | |
| View History | ❓ | [ ] | |
| Advanced Analytics | ❓ | [ ] | Gated by milestone |
| Post Metrics | ❓ | [ ] | |
| Analytics Export | ❓ | [ ] | |
| Top Posts Ranking | ❓ | [ ] | |

**Files affected:**
- `app/api/user/analytics/`
- `app/api/user/stats/`
- `app/api/portfolio/track/`
- `app/api/portfolio/[id]/view/`
- `app/api/cron/cleanup-views/`
- `components/dashboard/advanced-analytics.tsx`
- `components/dashboard/post-metrics.tsx`
- `components/dashboard/creator-stats-card.tsx`

---

## 7. Post & Hashtag Monitoring

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Social Post Tracking | ❓ | [ ] | |
| Hashtag Monitoring | ❓ | [ ] | Webhook-based |
| Multi-Platform Support | ❓ | [ ] | |
| Post Verification | ❓ | [ ] | |
| Engagement Metadata | ❓ | [ ] | |
| User Handle Matching | ❓ | [ ] | |

**Files affected:**
- `lib/hashtag-monitoring/`
- `app/api/webhooks/hashtag-monitor/`
- `app/api/cron/profile-monitoring/`
- `app/api/admin/monitoring/`
- `components/admin/monitoring-trigger.tsx`

**Dependencies:** Powers milestone system.

---

## 8. Creator Directory

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Directory Listing | ❓ | [ ] | |
| Niche Filtering | ❓ | [ ] | |
| Location Filtering | ❓ | [ ] | |
| Rate Range Filtering | ❓ | [ ] | |
| Availability Status | ❓ | [ ] | |
| Featured Creators | ❓ | [ ] | |
| Verified Badge | ❓ | [ ] | |
| Sort Options | ❓ | [ ] | |
| Brand-Only Access Gate | ❓ | [ ] | |

**Files affected:**
- `lib/directory/`
- `app/api/directory/`
- `app/(public)/creators/`
- `app/(dashboard)/dashboard/directory/`
- `components/directory/`
- `components/dashboard/directory-settings/`

---

## 9. Jobs System

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Job Listings | ❓ | [ ] | |
| Job Filtering | ❓ | [ ] | |
| Job Applications | ❓ | [ ] | |
| Application Status Workflow | ❓ | [ ] | |
| Job Status Workflow | ❓ | [ ] | |
| Compensation Types | ❓ | [ ] | |
| View Count Tracking | ❓ | [ ] | |
| Deadline Support | ❓ | [ ] | |
| Featured Jobs | ❓ | [ ] | |

**Files affected:**
- `lib/jobs/`
- `app/api/jobs/`
- `app/api/applications/`
- `app/api/admin/jobs/`
- `app/api/admin/applications/`
- `app/(dashboard)/dashboard/jobs/`
- `app/(dashboard)/dashboard/applications/`
- `app/(dashboard)/dashboard/admin/jobs/`
- `app/(dashboard)/dashboard/admin/applications/`
- `components/jobs/`

---

## 10. Brand Features

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Brand Dashboard | ❓ | [ ] | |
| Save Creators | ❓ | [ ] | |
| Brand Job Management | ❓ | [ ] | |
| Job Application Review | ❓ | [ ] | |
| Job Limits | ❓ | [ ] | |
| Creator Discovery | ❓ | [ ] | |

**Files affected:**
- `app/api/brand/`
- `app/api/brands/`
- `app/(dashboard)/dashboard/brand-jobs/`
- `app/(dashboard)/dashboard/brand-settings/`
- `app/(dashboard)/dashboard/saved/`
- `components/dashboard/saved-creator-card.tsx`
- `lib/hooks/use-brand-user.ts`

**Dependencies:** If removing brand role entirely, impacts directory access, jobs.

---

## 11. Notifications

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| In-App Notifications | ❓ | [ ] | |
| Notification Types | ❓ | [ ] | |
| Read/Unread State | ❓ | [ ] | |
| Email Notifications | ❓ | [ ] | |
| Email Preferences | ❓ | [ ] | |

**Files affected:**
- `lib/notifications/`
- `app/api/notifications/`
- `components/notifications/`

---

## 12. Email System

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Resend Integration | ❓ | [ ] | |
| Waitlist Emails | ❓ | [ ] | |
| Invite Emails | ❓ | [ ] | |
| Contact Form Emails | ❓ | [ ] | |
| Application Emails | ❓ | [ ] | |

**Files affected:**
- `lib/email/`
- `app/api/portfolio/contact/`

---

## 13. Admin Features

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Unified Admin Table | ❓ | [ ] | |
| User Management | ❓ | [ ] | |
| Invite Management | ❓ | [ ] | |
| Waitlist Management | ❓ | [ ] | |
| Job Administration | ❓ | [ ] | |
| Application Overview | ❓ | [ ] | |
| GitHub Connection | ❓ | [ ] | |
| Repo Assignment | ❓ | [ ] | |
| Deployment Monitoring | ❓ | [ ] | |
| Site Toggle | ❓ | [ ] | |
| Monitoring Trigger | ❓ | [ ] | |
| Questionnaire Review | ❓ | [ ] | |

**Files affected:**
- `lib/admin/`
- `app/api/admin/`
- `app/(dashboard)/dashboard/admin/`
- `components/admin/`

---

## 14. Waitlist System

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Waitlist Sign-up | ❓ | [ ] | |
| Social Handle Collection | ❓ | [ ] | |
| User Type Selection | ❓ | [ ] | |
| Admin Conversion | ❓ | [ ] | |

**Files affected:**
- `app/api/waitlist/`
- `app/api/admin/waitlist/`

---

## 15. Public/Landing Pages

| Feature | Decision | Status | Notes |
|---------|----------|--------|-------|
| Landing Page | ❓ | [ ] | |
| Social Proof | ❓ | [ ] | |
| Features Showcase | ❓ | [ ] | |
| Testimonials | ❓ | [ ] | |
| Pricing Section | ❓ | [ ] | |
| For Brands Section | ❓ | [ ] | |
| SEO (sitemap, robots) | ❓ | [ ] | |

**Files affected:**
- `app/page.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `components/landing/`

---

## Database Schema Changes

When removing features, update schema in `lib/db/schema.ts`:

| Table | Decision | Depends On |
|-------|----------|------------|
| users | ⚠️ SIMPLIFY | Remove unused columns |
| sessions | ✅ KEEP | Auth |
| accounts | ✅ KEEP | Auth |
| verifications | ✅ KEEP | Auth |
| onboardingQuestionnaires | ❓ | Portfolio AI |
| portfolioGenerations | ❓ | Portfolio AI |
| invites | ❓ | Invite system |
| waitlist | ❓ | Waitlist |
| contactSubmissions | ❓ | Portfolio contact |
| portfolioViewDedupe | ❓ | Analytics |
| viewHistory | ❓ | Analytics |
| media | ❓ | Media system |
| posts | ❓ | Post tracking |
| hashtagMentions | ❓ | Monitoring |
| milestones | ❓ | Milestone system |
| userMilestones | ❓ | Milestone system |
| savedCreators | ❓ | Brand features |
| contentJobs | ❓ | Jobs system |
| jobApplications | ❓ | Jobs system |
| portfolioProjects | ❓ | Portfolio projects |
| portfolioProjectMedia | ❓ | Portfolio projects |
| notifications | ❓ | Notifications |

---

## Removal Order (Suggested)

When removing features, follow this order to minimize breakage:

1. **UI Components** - Remove pages and components first
2. **API Routes** - Remove endpoints
3. **Library Code** - Remove lib/ modules
4. **Database Schema** - Remove tables/columns last
5. **Run migration** - Generate and apply Drizzle migration

---

## Agent Instructions

When working on this refactor:

1. **Check this file first** before modifying any feature
2. **Update status** `[ ]` → `[~]` → `[x]` as you work
3. **Remove completely** - Don't leave dead code or unused imports
4. **Update related files** - Check the "Files affected" lists
5. **Handle dependencies** - Check "Dependencies" notes before removing
6. **Test after each removal** - Run `npm run build` to catch breaks
7. **Create bd issues** for complex removals that need multi-step work

---

## Quick Reference: Likely Removal Candidates

Features that are complex and may be candidates for removal:
- AI Portfolio Generation (expensive, complex)
- Hashtag Monitoring (external dependencies)
- Milestone/Rewards System (complex gamification)
- Brand Role entirely (simplify to creator-only)
- Advanced Analytics (if simplifying)

Features likely to keep:
- Basic Auth
- User Profiles
- Media Upload
- Basic Portfolio Projects (without AI)
