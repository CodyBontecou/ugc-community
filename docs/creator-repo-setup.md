# Creator Portfolio Repository Setup

This guide explains how to set up automatic creator registration for portfolio sites deployed via Vercel. When you push to the main branch, a GitHub Action will automatically register the creator in the ugc.community database.

## Prerequisites

- A GitHub repository for the creator's portfolio site
- The repository connected to Vercel for deployment
- Access to the `CREATOR_REGISTRATION_SECRET` from the ugc.community team

## Setup Steps

### 1. Create the creator config file

Create a `creator.json` file in the root of the repository:

```json
{
  "subdomain": "dany",
  "name": "Dany Smith",
  "email": "dany@example.com",
  "displayName": "Dany Smith",
  "bio": "Fashion & lifestyle UGC creator based in LA",
  "websiteUrl": "https://dany.ugc.community",
  "instagramHandle": "danysmith",
  "tiktokHandle": "danysmith",
  "youtubeHandle": "",
  "twitterHandle": ""
}
```

#### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `subdomain` | Yes | The subdomain for the portfolio (e.g., "dany" for dany.ugc.community). Lowercase alphanumeric with optional hyphens. |
| `name` | Yes | Creator's full name |
| `email` | Yes | Creator's email address |
| `displayName` | No | Display name (defaults to `name`) |
| `bio` | No | Short bio (max 1000 characters) |
| `websiteUrl` | No | Creator's website URL |
| `instagramHandle` | No | Instagram username (without @) |
| `tiktokHandle` | No | TikTok username (without @) |
| `youtubeHandle` | No | YouTube channel handle |
| `twitterHandle` | No | Twitter/X username (without @) |

### 2. Add the GitHub Action workflow

Create `.github/workflows/register-creator.yml`:

```yaml
name: Register Creator

on:
  push:
    branches:
      - main
    paths:
      - 'creator.json'
  workflow_dispatch: # Allow manual trigger

jobs:
  register:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Read creator config
        id: config
        run: |
          # Read and validate creator.json exists
          if [ ! -f creator.json ]; then
            echo "Error: creator.json not found"
            exit 1
          fi

          # Output the config as a single line for the next step
          CONFIG=$(cat creator.json | jq -c '.')
          echo "config=$CONFIG" >> $GITHUB_OUTPUT

      - name: Register creator with ugc.community
        env:
          CREATOR_REGISTRATION_SECRET: ${{ secrets.CREATOR_REGISTRATION_SECRET }}
          API_URL: ${{ vars.UGC_API_URL || 'https://ugc.community' }}
        run: |
          CONFIG='${{ steps.config.outputs.config }}'

          echo "Registering creator..."

          RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            "${API_URL}/api/admin/register-creator" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${CREATOR_REGISTRATION_SECRET}" \
            -d "$CONFIG")

          # Extract HTTP status code (last line)
          HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
          # Extract response body (everything except last line)
          BODY=$(echo "$RESPONSE" | sed '$d')

          echo "Response: $BODY"
          echo "HTTP Status: $HTTP_CODE"

          if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
            echo "✅ Creator registered successfully!"
            echo "$BODY" | jq '.'
          else
            echo "❌ Failed to register creator"
            echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
            exit 1
          fi
```

### 3. Add the repository secret

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `CREATOR_REGISTRATION_SECRET`
4. Value: The secret provided by the ugc.community team
5. Click **Add secret**

### 4. (Optional) Set custom API URL

If testing against a staging environment:

1. Go to **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Click **New repository variable**
3. Name: `UGC_API_URL`
4. Value: `https://staging.ugc.community` (or your test URL)

## How It Works

1. You push changes to the `main` branch (including updates to `creator.json`)
2. GitHub Action triggers and reads `creator.json`
3. Action calls the ugc.community API with the creator data
4. The API creates or updates the creator record in the database
5. The creator now appears in queries (landing page, directory, etc.)

## Updating Creator Info

To update a creator's information:

1. Edit `creator.json` with the new values
2. Commit and push to `main`
3. The GitHub Action will automatically update the database record

## Manual Trigger

You can manually trigger the registration:

1. Go to **Actions** → **Register Creator**
2. Click **Run workflow**
3. Select the `main` branch
4. Click **Run workflow**

## Troubleshooting

### "Invalid or missing authorization token"

- Verify `CREATOR_REGISTRATION_SECRET` is set correctly in repository secrets
- Ensure there are no extra spaces or newlines in the secret

### "Subdomain must be lowercase alphanumeric"

- Check that `subdomain` in `creator.json` only contains:
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Hyphens (-), but not at the start or end

### "creator.json not found"

- Ensure `creator.json` is in the repository root
- Check that it's committed and pushed

### Action doesn't trigger

- Verify the workflow file is at `.github/workflows/register-creator.yml`
- Check that you're pushing to the `main` branch
- Ensure `creator.json` was modified in the commit (or use manual trigger)

## Example Repository Structure

```
your-creator-repo/
├── .github/
│   └── workflows/
│       └── register-creator.yml
├── creator.json
├── src/
│   └── ... (your site code)
├── package.json
└── README.md
```

## Support

Contact the ugc.community team if you need:
- The `CREATOR_REGISTRATION_SECRET` for your repository
- Help troubleshooting registration issues
- Updates to allowed fields or functionality
