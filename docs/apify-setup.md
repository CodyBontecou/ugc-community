# Apify Mention Monitoring Setup

This guide explains how to set up Apify actors to monitor @ugc.community mentions across social media platforms and send data to ugc.community via webhooks.

## Overview

Apify is a web scraping and automation platform that provides actors (pre-built scrapers) for various social media platforms. We use these actors to monitor mentions of @ugc.community and receive webhook notifications when new posts are found.

## Prerequisites

1. An Apify account (free tier available): https://apify.com
2. Access to the ugc.community admin panel
3. Environment variables configured

## Environment Variables

Add these to your `.env.local`:

```bash
# Apify Integration
APIFY_API_TOKEN="your-apify-api-token"
APIFY_WEBHOOK_SECRET="your-webhook-secret"  # Generate with: openssl rand -base64 32
```

## Step 1: Create Apify Account

1. Go to https://apify.com and sign up
2. Navigate to Settings → Integrations → API tokens
3. Create a new API token with appropriate permissions
4. Copy the token to your `APIFY_API_TOKEN` environment variable

## Step 2: Configure Webhook Secret

Generate a secure webhook secret:

```bash
openssl rand -base64 32
```

Save this as `APIFY_WEBHOOK_SECRET` in your environment variables.

## Step 3: Set Up Actors by Platform

### Instagram Search Scraper

**Actor ID:** `apify/instagram-scraper`

**Store URL:** https://apify.com/apify/instagram-scraper

**Configuration:**
```json
{
  "search": "@ugc.community",
  "searchType": "user",
  "resultsLimit": 100
}
```

Alternatively, monitor posts that tag the @ugc.community account directly using the profile scraper.

### TikTok Scraper

**Actor ID:** `clockworks/tiktok-scraper`

**Store URL:** https://apify.com/clockworks/tiktok-scraper

**Configuration:**
```json
{
  "searchQueries": ["@ugc.community"],
  "resultsPerPage": 100,
  "shouldDownloadVideos": false
}
```

### X (Twitter) Scraper

**Actor ID:** `apidojo/tweet-scraper`

**Store URL:** https://apify.com/apidojo/tweet-scraper

**Configuration:**
```json
{
  "searchTerms": ["@ugc_community"],
  "maxTweets": 100,
  "sort": "Latest"
}
```

Note: Twitter doesn't allow dots in usernames, so use `@ugc_community` (underscore).

### YouTube Search Scraper

**Actor ID:** `streamers/youtube-scraper`

**Store URL:** https://apify.com/streamers/youtube-scraper

**Configuration:**
```json
{
  "searchKeywords": ["ugc.community", "@ugc.community"],
  "maxResults": 100
}
```

### Facebook Posts Scraper

**Actor ID:** `apify/facebook-posts-scraper`

**Store URL:** https://apify.com/apify/facebook-posts-scraper

**Configuration:**
```json
{
  "searchQueries": ["@ugc.community"],
  "maxPosts": 100
}
```

## Step 4: Configure Webhooks

For each actor, configure a webhook to send data to ugc.community:

1. Open the actor in Apify Console
2. Go to the "Webhooks" tab
3. Click "Add webhook"
4. Configure:
   - **Event type:** `ACTOR.RUN.SUCCEEDED`
   - **Request URL:** `https://ugc.community/api/webhooks/hashtag-monitor/apify`
   - **Payload template:** Use default (full dataset)
   - **Headers:** Add `X-Apify-Webhook-Secret: YOUR_WEBHOOK_SECRET`

## Step 5: Schedule Actor Runs

Set up schedules to run actors periodically:

1. Go to the actor's "Schedules" tab
2. Create a new schedule
3. Recommended frequencies:
   - Instagram: Every 6 hours
   - TikTok: Every 6 hours
   - X/Twitter: Every 4 hours
   - YouTube: Every 12 hours
   - Facebook: Every 12 hours

## Webhook Payload Format

Apify sends webhook payloads in this format:

```json
{
  "userId": "apify-user-id",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "eventType": "ACTOR.RUN.SUCCEEDED",
  "eventData": {
    "actorId": "apify/instagram-hashtag-scraper",
    "actorRunId": "run-id",
    "status": "SUCCEEDED"
  },
  "resource": {
    "defaultDatasetId": "dataset-id"
  }
}
```

The handler fetches the actual data from the dataset using the Apify API.

## Testing

### Verify Webhook Endpoint

```bash
curl -X GET https://ugc.community/api/webhooks/hashtag-monitor/apify
```

Expected response:
```json
{
  "provider": "apify",
  "status": "ready"
}
```

### Manual Test (Development)

```bash
curl -X POST https://localhost:3000/api/webhooks/hashtag-monitor/apify \
  -H "Content-Type: application/json" \
  -H "X-Apify-Webhook-Secret: your-secret" \
  -d '{"test": true}'
```

## Monitoring & Debugging

### Check Apify Dashboard

- Monitor actor runs at https://console.apify.com/actors
- View webhook delivery status in the Webhooks tab
- Check actor logs for scraping issues

### Check Application Logs

Monitor your application logs for:
- Webhook receipt confirmations
- Parsing errors
- Database insertion results
- User matching outcomes

## Cost Estimation

Apify pricing is usage-based. Estimated monthly costs for moderate hashtag monitoring:

| Platform | Frequency | Est. Cost/month |
|----------|-----------|-----------------|
| Instagram | 4x/day | $5-10 |
| TikTok | 4x/day | $5-10 |
| X/Twitter | 6x/day | $3-5 |
| YouTube | 2x/day | $2-3 |
| Facebook | 2x/day | $3-5 |

**Total estimated:** $18-33/month

Costs vary based on:
- Number of results per run
- Hashtag popularity
- Platform complexity

## Troubleshooting

### Webhook Not Receiving Data

1. Verify the webhook URL is correct
2. Check that the secret header matches
3. Ensure the actor run completed successfully
4. Check Apify webhook delivery logs

### Posts Not Being Matched to Users

1. Verify user has added their social handle in settings
2. Check the handle format (with/without @)
3. Run the reprocess command for unmatched mentions

### Rate Limiting

If you hit rate limits:
1. Reduce actor run frequency
2. Lower `resultsLimit` in actor configuration
3. Consider upgrading Apify plan

## Security Notes

- Never commit `APIFY_API_TOKEN` or `APIFY_WEBHOOK_SECRET` to version control
- Rotate secrets periodically
- Use environment-specific secrets for dev/staging/production
- The webhook endpoint validates signatures before processing
