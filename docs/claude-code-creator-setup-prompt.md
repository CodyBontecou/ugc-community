# Claude Code: UGC Community Creator Registration Setup

> **Instructions for Claude Code**: Follow these steps to set up automatic creator registration for this repository.

## Task

Set up GitHub Actions to automatically register this creator with ugc.community when code is pushed to the main branch.

## Steps

### 1. Create `creator.json` in the repository root

Ask the user for the following information, then create the file:

```json
{
  "subdomain": "<ask user - lowercase, alphanumeric, hyphens ok>",
  "name": "<ask user - full name>",
  "email": "<ask user - email address>",
  "displayName": "<optional - display name>",
  "bio": "<optional - short bio, max 1000 chars>",
  "websiteUrl": "<optional - full URL>",
  "instagramHandle": "<optional - without @>",
  "tiktokHandle": "<optional - without @>",
  "youtubeHandle": "<optional - channel handle>",
  "twitterHandle": "<optional - without @>"
}
```

**Validation rules for subdomain:**
- Must be lowercase
- Only letters (a-z), numbers (0-9), and hyphens (-)
- Cannot start or end with a hyphen
- Max 63 characters

### 2. Create `.github/workflows/register-creator.yml`

Create this exact file:

```yaml
name: Register Creator

on:
  push:
    branches:
      - main
    paths:
      - 'creator.json'
  workflow_dispatch:

jobs:
  register:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Read creator config
        id: config
        run: |
          if [ ! -f creator.json ]; then
            echo "Error: creator.json not found"
            exit 1
          fi
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
          HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
          BODY=$(echo "$RESPONSE" | sed '$d')
          echo "Response: $BODY"
          echo "HTTP Status: $HTTP_CODE"
          if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
            echo "Creator registered successfully!"
            echo "$BODY" | jq '.'
          else
            echo "Failed to register creator"
            echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
            exit 1
          fi
```

### 3. Remind the user about the GitHub secret

After creating the files, tell the user:

> **Important**: You need to add the `CREATOR_REGISTRATION_SECRET` to this repository's GitHub secrets.
>
> 1. Go to GitHub → Repository → Settings → Secrets and variables → Actions
> 2. Click "New repository secret"
> 3. Name: `CREATOR_REGISTRATION_SECRET`
> 4. Value: `MoMuo1ba34PRJuhH06LjCTWzmQAi2cdFe1u+fBQ0uxY=`
> 5. Click "Add secret"
>
> Once added, push these changes to `main` and the creator will be automatically registered.

### 4. Commit the changes

Stage and commit both files:
- `creator.json`
- `.github/workflows/register-creator.yml`

Use commit message: `chore: add ugc.community creator registration`

## Questions to Ask User

Before creating `creator.json`, ask:

1. "What subdomain do you want? (This will be `<subdomain>.ugc.community`)"
2. "What's the creator's full name?"
3. "What's the creator's email?"
4. "Any social handles to include? (Instagram, TikTok, YouTube, Twitter)"
5. "Short bio? (optional)"

## Example Interaction

```
User: Set up ugc.community registration

Claude: I'll set up automatic creator registration. I need some info:

1. What subdomain? (e.g., "dany" for dany.ugc.community)
2. Creator's full name?
3. Creator's email?
4. Social handles? (Instagram, TikTok, etc.)

User: subdomain: sarah, name: Sarah Johnson, email: sarah@email.com, instagram: sarahcreates

Claude: [Creates creator.json and workflow file, commits, reminds about secret]
```
