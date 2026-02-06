# Scrape Creators Integration

Profile monitoring for @ugc.community mentions using the [Scrape Creators API](https://scrapecreators.com/).

## Overview

The system scrapes registered users' TikTok and Instagram profiles to detect posts that mention `@ugc.community`. When a mention is found, the post is credited to the user's account and milestone tracking is updated.

### How It Works (Peek-Then-Fetch)

1. **PEEK**: For each user, fetch their profile info (1 credit) to get current video/post count
2. **COMPARE**: Check against last-known count stored in our DB
3. **FETCH**: Only if the count increased, fetch the actual videos/posts (more credits)
4. **PROCESS**: Parse posts, detect @ugc.community mentions, match to active jobs, save to DB

This avoids wasting credits on users who haven't posted new content.

## Environment Variables

```bash
# Scrape Creators API key
# Sign up at: https://app.scrapecreators.com
SCRAPE_CREATORS_API_KEY="your-api-key"
```

## API Endpoints Used

| Endpoint | Cost | Purpose |
|----------|------|---------|
| `GET /v1/tiktok/profile` | 1 credit | Check videoCount |
| `GET /v3/tiktok/profile/videos` | varies | Fetch recent videos |
| `GET /v1/instagram/basic-profile` | 1 credit | Check media_count |
| `GET /v2/instagram/user/posts` | varies | Fetch recent posts |

## Scheduling

The cron job runs every 12 hours (configured in `vercel.json`):
- `GET /api/cron/profile-monitoring` — protected by `CRON_SECRET`

## Admin Endpoints

- `GET /api/admin/monitoring/trigger` — View registered handles per platform
- `POST /api/admin/monitoring/trigger` — Manually trigger a scrape (optional `{ platform: "tiktok" | "instagram" }`)
- `GET /api/admin/monitoring/debug` — Debug config, recent mentions, search by handle

## Cost Estimation

With 50 registered users checked every 12 hours:

| Step | Credits/run | Credits/month |
|------|-------------|---------------|
| Profile peeks (50 users × 2 platforms) | 100 | ~6,000 |
| Video fetches (only users with new content, ~20%) | ~20 | ~1,200 |
| **Total** | ~120 | **~7,200** |

At the Freelance plan ($47 for 25K credits), this is well within budget.

## Database Schema

Tracking columns on the `users` table:
- `last_known_tiktok_video_count` — Last seen videoCount from TikTok profile
- `last_known_instagram_post_count` — Last seen media_count from Instagram profile
- `last_scraped_at` — When the user was last checked

Detected posts are stored in the `hashtag_mentions` table with `source = 'scrapecreators'`.

## Architecture

```
Cron (every 12h)
  │
  ├─ For each user with TikTok handle:
  │   ├─ GET /v1/tiktok/profile → compare videoCount
  │   │   └─ If new: GET /v3/tiktok/profile/videos → parse
  │   └─ Update last_known_tiktok_video_count
  │
  ├─ For each user with Instagram handle:
  │   ├─ GET /v1/instagram/basic-profile → compare media_count
  │   │   └─ If new: GET /v2/instagram/user/posts → parse
  │   └─ Update last_known_instagram_post_count
  │
  └─ Process all new posts:
      ├─ Filter posts older than 14 days
      ├─ Match author handle → registered user
      ├─ Detect @ugc.community mentions
      ├─ Match to active content jobs
      ├─ Insert into hashtag_mentions (dedup on post_url)
      └─ Update milestone tracking + send emails
```

## Key Files

- `lib/hashtag-monitoring/providers/scrapecreators.ts` — API client
- `lib/hashtag-monitoring/profile-scraper.ts` — Peek-then-fetch orchestration
- `lib/hashtag-monitoring/handler.ts` — Post processing, DB writes, milestone tracking
- `app/api/cron/profile-monitoring/route.ts` — Cron endpoint
- `app/api/admin/monitoring/trigger/route.ts` — Admin manual trigger
- `components/admin/monitoring-trigger.tsx` — Admin UI widget
