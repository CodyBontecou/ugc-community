# Extend Profile Monitoring to YouTube Shorts

## Goal

Add YouTube Shorts monitoring to the existing Scrape Creators profile scraping pipeline. Follow the same peek-then-fetch optimization pattern used for TikTok and Instagram.

## Context

We recently migrated from Apify to Scrape Creators (`https://scrapecreators.com/`). The system scrapes registered users' TikTok and Instagram profiles every 12 hours to detect posts mentioning `@ugc.community`. See `docs/scrape-creators-setup.md` for architecture details.

The user schema already has `youtubeHandles` (`text("youtube_handles").array()`) on the `users` table — users can already save their YouTube handles in their settings.

## Scrape Creators API Endpoints to Use

### 1. Channel Details (peek) — 1 credit
```
GET https://api.scrapecreators.com/v1/youtube/channel?handle={handle}
Header: x-api-key: {key}
```
Response (relevant fields):
```json
{
  "channelId": "UCX6OQ3DkcsbYNE6H8uQQuVA",
  "handle": "MrBeast",
  "name": "MrBeast",
  "subscriberCount": 358000000,
  "videoCount": 946,
  "viewCount": 84614230966,
  "description": "...",
  "avatar": "https://..."
}
```
Use `videoCount` for the peek optimization (compare against `last_known_youtube_video_count`).

### 2. Channel Shorts (fetch) — credits vary
```
GET https://api.scrapecreators.com/v1/youtube/channel/shorts?handle={handle}&sort=newest
Header: x-api-key: {key}
```
Response:
```json
{
  "shorts": [
    {
      "type": "short",
      "id": "_sBRk9ADpK8",
      "url": "https://www.youtube.com/watch?v=_sBRk9ADpK8",
      "title": "Flip a Coin, Win $30,000",
      "viewCountInt": 206484140,
      "viewCountText": "206,484,140",
      "commentCountInt": 20000,
      "likeCountInt": 3695440,
      "publishDate": "2026-01-27T09:00:03-08:00",
      "description": null,
      "genre": "Entertainment"
    }
  ],
  "continuationToken": "4qmFsgKrCBIYVUNkRkpXVWE0M3NtUm00SXBIQnB..."
}
```

**Important**: The shorts endpoint does NOT return descriptions (they're `null`). If mention detection in descriptions is needed, you'd need to also call the Video/Short Details endpoint per video (`GET /v1/youtube/video?url={url}`, 1 credit each). For now, check the `title` field for `@ugc.community` mentions. Most UGC creators put mentions in titles.

## Files to Modify

### 1. `lib/db/schema.ts`
Add to the `users` table:
```ts
lastKnownYoutubeVideoCount: integer("last_known_youtube_video_count"),
```

### 2. Database Migration
Create `drizzle/0046_add_youtube_scrape_tracking.sql`:
```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_known_youtube_video_count" integer;
```
Run against Neon DB.

### 3. `lib/hashtag-monitoring/providers/scrapecreators.ts`
Add YouTube types and API functions:
- `YouTubeChannelResponse` interface — maps to the channel details response
- `YouTubeShortItem` interface — maps to a single short in the shorts array
- `YouTubeChannelShortsResponse` interface — the full shorts response with `continuationToken`
- `getYouTubeChannel(handle: string)` — calls `/v1/youtube/channel`
- `getYouTubeChannelShorts(handle: string, continuationToken?: string)` — calls `/v1/youtube/channel/shorts`

### 4. `lib/hashtag-monitoring/profile-scraper.ts`
- Add `"youtube"` to the `SupportedPlatform` type
- Add `scrapeYouTubeProfile(userId, handle, lastKnownCount)` function following the same peek-then-fetch pattern as TikTok/Instagram:
  1. Call `getYouTubeChannel(handle)` → get `videoCount`
  2. Compare against `lastKnownYoutubeVideoCount`
  3. If increased, call `getYouTubeChannelShorts(handle)` → parse into `ParsedPost[]`
  4. Update `lastKnownYoutubeVideoCount` in DB
- Add `parseYouTubeShort(short: YouTubeShortItem, handle, channelName)` function that maps to `ParsedPost`:
  - `platform: "youtube"`
  - `postUrl: short.url`
  - `postId: short.id`
  - `authorHandle: handle`
  - `authorName: channelName`
  - `content: short.title` (descriptions are null for shorts)
  - `engagement: { views: short.viewCountInt, likes: short.likeCountInt, comments: short.commentCountInt }`
  - `postedAt: new Date(short.publishDate)`
- Update `getUserHandlesWithCounts` to handle youtube platform
- Add `"youtube"` to the platforms array in `scrapeAllPlatforms()`

### 5. `lib/hashtag-monitoring/handler.ts`
The `matchUserByHandle` function already has a `case "youtube"` that queries `users.youtubeHandles` — no changes needed here.

### 6. `lib/hashtag-monitoring/types.ts`
`Platform` type already includes `"youtube"` — no changes needed.

### 7. `scripts/test-scrapecreators.ts`
Add YouTube tests:
- Test `getYouTubeChannel` with a known handle (e.g., `MrBeast`)
- Verify `videoCount` is a number > 0
- Test `getYouTubeChannelShorts` — verify `shorts` array with expected fields
- Add `--yt-handle` CLI flag like the existing `--ig-handle`

## Important Notes

- **videoCount caveat**: YouTube's `videoCount` includes ALL videos (not just shorts). This means the peek optimization won't be as precise — it'll trigger a fetch whenever ANY video is uploaded, not just shorts. This is acceptable; the alternative (fetching shorts every time to compare) costs more credits than the occasional unnecessary fetch.
- **No description on shorts list**: The `/v1/youtube/channel/shorts` endpoint returns `null` for `description`. Mention detection should check the `title` field. If you later need full descriptions, you'd need to call `/v1/youtube/video?url={url}` per short (1 credit each) — only do this if title-based detection proves insufficient.
- **Pagination**: The shorts endpoint returns a `continuationToken` for pagination. For the initial implementation, just fetch the first page (most recent ~48 shorts). This is plenty since we run every 12 hours.
- **Handle format**: YouTube handles can be with or without `@` prefix. The Scrape Creators API accepts handles without the `@`. Strip it if stored with the prefix.
