# Brand Dashboard Experience - Implementation Prompt

## Context

We're building a dashboard experience for brand/hiring users on ugc.community. Currently, brands see an empty dashboard with just a welcome header and account section. We need to give them tools to discover and work with UGC creators.

**Related Beads Tickets:**
- `ugc-community-1di` - Brand Dashboard Experience (epic)
- `ugc-community-qib` - Add user type to waitlist signup
- `ugc-community-7lx` - Add role to invite system
- `ugc-community-m6s` - Auto-set user role from invite on signup
- `ugc-community-l4d` - Brand dashboard home page
- `ugc-community-2jr` - Creator directory browsing for brands

## Phase 1: Brand Onboarding Flow (Priority)

Before we can test the brand dashboard, we need a way to onboard brand users.

### 1.1 Add User Type to Waitlist (`ugc-community-qib`)

Update the waitlist signup to capture whether someone is a creator or brand.

**Database Changes:**
```sql
-- drizzle/0008_add_waitlist_user_type.sql
ALTER TABLE waitlist ADD COLUMN user_type text NOT NULL DEFAULT 'creator';
```

**Schema Update** (`lib/db/schema.ts`):
- Add `userType: text("user_type").notNull().default("creator")` to waitlist table

**UI Changes** (`components/auth/waitlist-form.tsx`):
- Add a toggle/tabs at the top: "I'm a Creator" | "I'm a Brand"
- When "Brand" is selected, hide the social handles section (not relevant for brands)
- Maybe add a "Company name" field for brands instead

**API Update** (`app/api/waitlist/route.ts`):
- Accept `userType` in the request body
- Validate it's either "creator" or "brand"

### 1.2 Add Role to Invites (`ugc-community-7lx`)

**Database Changes:**
```sql
-- drizzle/0009_add_invite_role.sql
ALTER TABLE invites ADD COLUMN role text NOT NULL DEFAULT 'creator';
```

**Schema Update** (`lib/db/schema.ts`):
- Add `role: text("role").notNull().default("creator")` to invites table

**Admin UI Updates:**
- When creating an invite, show a role selector (Creator/Brand)
- When inviting from waitlist, pre-populate role from the waitlist entry's userType
- Show the role in the invites table

**API Update** (`app/api/admin/invites/route.ts`):
- Accept `role` in the request body when creating invites

### 1.3 Auto-set Role on Signup (`ugc-community-m6s`)

When a user signs up using an invite, set their role based on the invite.

**Auth Flow Update:**
- In the auth callback/user creation logic, look up the invite
- Read the `role` from the invite
- Set the new user's `role` field accordingly

---

## Phase 2: Brand Dashboard Home (`ugc-community-l4d`)

Once brands can sign up, build their dashboard experience.

**Location:** `app/(dashboard)/dashboard/page.tsx`

**When `isUserBrand` is true, show:**

1. **Welcome Section**
   - "Welcome to ugc.community, [Name]!"
   - Brief explanation: "Find and connect with UGC creators for your brand"

2. **Quick Actions Card**
   - "Browse Creators" → links to /creators directory
   - "Saved Creators" → links to /dashboard/saved (future)
   - "View Campaigns" → links to /dashboard/campaigns (future)

3. **Getting Started Checklist** (if new user)
   - [ ] Complete your brand profile
   - [ ] Browse the creator directory
   - [ ] Save creators you're interested in
   - [ ] Start your first campaign

4. **Stats Overview** (placeholder for now)
   - Saved creators count
   - Active campaigns count
   - Messages/inquiries count

---

## Phase 3: Creator Directory Access (`ugc-community-2jr`)

Ensure brands can browse creators effectively.

**Verify Access:**
- Confirm brands can access `/creators` (public directory)
- Confirm brands can view individual creator profiles

**Integrate into Dashboard:**
- Add prominent "Browse Creators" CTA on brand dashboard
- Consider adding a mini-preview of featured creators on dashboard

---

## Build Order

```
Phase 1 (Sequential - dependencies):
  qib → 7lx → m6s

Phase 2 (Can start after epic, parallel with Phase 1):
  l4d (brand home page)

Phase 3 (After Phase 2):
  2jr (directory browsing integration)
```

## Testing

1. Sign up for waitlist as a brand
2. Admin sends invite with brand role
3. Sign up with invite → verify role is "brand"
4. Visit dashboard → verify brand-specific content shows
5. Browse creator directory → verify access works

## Commands

```bash
# Start work on a ticket
bd update <id> --status=in_progress

# When done
bd close <id>
bd sync
```
