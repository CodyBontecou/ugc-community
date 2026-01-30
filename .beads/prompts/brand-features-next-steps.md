# Brand Features - Next Steps Implementation Prompt

## Context

The brand onboarding flow and basic dashboard are now complete (commit 136517b). Brands can:
- Sign up via the waitlist with "I'm a Brand" selected
- Receive invites with the brand role
- Auto-receive the brand role on signup
- See a brand-specific dashboard with quick actions and getting started checklist
- Browse the public creator directory via `/creators`

The remaining features to build out the full brand experience are below, in priority order.

**Related Beads Tickets:**
- `ugc-community-1di` - Brand Dashboard Experience (epic - keep open until all features done)
- `ugc-community-003` - Saved/favorited creators for brands (P2)
- `ugc-community-1ui` - Messaging system for brands and creators (P3)
- `ugc-community-818` - Campaign management for brands (P3)

---

## Phase 1: Saved Creators (`ugc-community-003`) - Priority

Allow brands to save/favorite creators they want to work with.

### 1.1 Database Schema

Create migration `drizzle/0029_add_saved_creators.sql`:

```sql
CREATE TABLE saved_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes text,
  saved_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(brand_id, creator_id)
);

CREATE INDEX saved_creators_brand_id_idx ON saved_creators(brand_id);
CREATE INDEX saved_creators_creator_id_idx ON saved_creators(creator_id);
```

Add to `lib/db/schema.ts`:
```typescript
export const savedCreators = pgTable(
  "saved_creators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: text("brand_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    creatorId: text("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    notes: text("notes"),
    savedAt: timestamp("saved_at").notNull().defaultNow(),
  },
  (table) => [
    index("saved_creators_brand_id_idx").on(table.brandId),
    index("saved_creators_creator_id_idx").on(table.creatorId),
    unique("saved_creators_brand_creator_unique").on(table.brandId, table.creatorId),
  ]
);
```

### 1.2 API Endpoints

Create `app/api/brands/saved-creators/route.ts`:
- `GET` - List saved creators for current brand user
- `POST` - Save a creator (body: `{ creatorId, notes? }`)

Create `app/api/brands/saved-creators/[creatorId]/route.ts`:
- `DELETE` - Unsave a creator
- `PATCH` - Update notes for a saved creator

### 1.3 UI Components

**Save Button Component** (`components/creators/save-creator-button.tsx`):
- Heart/bookmark icon button
- Toggles saved state on click
- Only visible to brand users
- Shows filled icon when saved

**Add to creator cards** in `/creators` directory:
- Add SaveCreatorButton to each creator card
- Add SaveCreatorButton to individual creator profile pages

### 1.4 Dashboard Page

Create `app/(dashboard)/dashboard/saved/page.tsx`:
- List all saved creators with their profiles
- Ability to view/edit notes
- Link to creator profiles
- Remove from saved

**Update dashboard** (`app/(dashboard)/dashboard/page.tsx`):
- Make "Saved Creators" quick action link to `/dashboard/saved`
- Show saved creator count in stats (once we have that data)

---

## Phase 2: Messaging System (`ugc-community-1ui`) - P3

This is a larger feature. Consider breaking into sub-tasks:

### Database Schema

```sql
-- Conversations between two users
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Messages within conversations
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
```

### Key Components

1. **Conversation List** - `/dashboard/messages`
2. **Message Thread View** - `/dashboard/messages/[conversationId]`
3. **New Message Button** - On creator profiles for brands
4. **Unread Indicator** - In navbar/dashboard
5. **Email Notifications** - For new messages (optional, via existing email system)

### Implementation Notes

- Start with polling for simplicity, upgrade to WebSockets/Pusher later if needed
- Consider rate limiting message sending
- Add spam/abuse reporting capability

---

## Phase 3: Campaign Management (`ugc-community-818`) - P3

This is the most complex feature. MVP scope:

### Database Schema

```sql
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  budget text, -- 'budget' | 'mid' | 'premium' or specific amount
  status text NOT NULL DEFAULT 'draft', -- 'draft' | 'active' | 'completed' | 'cancelled'
  requirements text,
  deadline timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX campaigns_brand_id_idx ON campaigns(brand_id);
CREATE INDEX campaigns_status_idx ON campaigns(status);
```

### Key Pages

1. **Campaign List** - `/dashboard/campaigns`
2. **Create Campaign** - `/dashboard/campaigns/new`
3. **Campaign Detail** - `/dashboard/campaigns/[id]`
4. **Edit Campaign** - `/dashboard/campaigns/[id]/edit`

### Future Iterations (not MVP)

- Invite creators to campaigns
- Creator applications/proposals
- Deliverable tracking
- Payment integration

---

## Build Order

```
Phase 1: Saved Creators (recommended next)
  - Database schema
  - API endpoints
  - Save button component
  - Dashboard page

Phase 2: Messaging (after Phase 1)
  - Break into sub-tickets first
  - Start with basic polling implementation

Phase 3: Campaigns (after Phase 2)
  - Break into sub-tickets first
  - MVP: CRUD only, no creator invites
```

---

## Testing

After each phase:
1. Sign in as a brand user
2. Test the new feature end-to-end
3. Verify dashboard updates correctly
4. Test edge cases (no saved creators, empty states, etc.)

---

## Commands

```bash
# Start work on a ticket
bd update <id> --status=in_progress

# When done
bd close <id>
bd sync
```
