# Wildcard DNS and Vercel Subdomain Setup

This guide covers the one-time infrastructure setup required to enable wildcard subdomain routing for creator sites on ugc.community.

## Overview

Creator portfolio sites are accessible via subdomains (e.g., `johndoe.ugc.community`). This requires:
1. Wildcard DNS configuration pointing to Vercel
2. Vercel project configuration to handle wildcard domains
3. Environment variables for the Vercel API

## Prerequisites

- Access to the DNS provider for `ugc.community`
- Admin access to the Vercel project
- Vercel account with a team (recommended) or personal account

---

## 1. DNS Configuration

### Add Wildcard CNAME Record

In your DNS provider (e.g., Cloudflare, Namecheap, Route 53), add a wildcard CNAME record:

| Type  | Name | Target                  | TTL  |
|-------|------|-------------------------|------|
| CNAME | *    | cname.vercel-dns.com    | Auto |

**Important Notes:**
- The `*` (wildcard) matches any subdomain (e.g., `johndoe`, `creator-name`, etc.)
- Keep existing A/AAAA records for the apex domain (`ugc.community`) intact
- DNS propagation typically takes 5-30 minutes, but can take up to 48 hours

### Verify DNS Configuration

After adding the record, verify with:

```bash
# Check wildcard DNS resolution
dig test-subdomain.ugc.community CNAME

# Expected output should show:
# test-subdomain.ugc.community. IN CNAME cname.vercel-dns.com.
```

---

## 2. Vercel Configuration

### Option A: Add Wildcard Domain to Main Project (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **ugc-community** project
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter `*.ugc.community`
6. Vercel will verify domain ownership

**Note:** This approach routes ALL subdomain traffic to the main ugc.community project. Individual creator sites are deployed as separate Vercel projects with their specific subdomains added via the API.

### Option B: Per-Project Domain Configuration

Each creator's Vercel project gets their specific subdomain added:
- Creator project → `johndoe.ugc.community`

The admin panel handles this via the "Enable Site" toggle, which calls the Vercel API to add/remove domains.

### Verify Domain in Vercel

1. Check the domain status in Vercel Dashboard → Settings → Domains
2. Status should show "Valid Configuration" with a green checkmark
3. SSL certificate will be automatically provisioned

---

## 3. Environment Variables

Add these environment variables to your production environment:

### VERCEL_API_TOKEN (Required)

Generate a Vercel API token:

1. Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name: `ugc-community-api` (or similar)
4. Scope: Full Account (or limit to specific projects if using granular tokens)
5. Expiration: Choose based on your security requirements
6. Copy the token immediately (shown only once)

Add to production environment:
```
VERCEL_API_TOKEN=your_token_here
```

### VERCEL_TEAM_ID (Required for Team Accounts)

If your Vercel project is under a team:

1. Go to [Vercel Team Settings](https://vercel.com/teams)
2. Select your team
3. Go to **Settings** → **General**
4. Find the **Team ID** (format: `team_xxxxxxxxxxxxxxxxxxxx`)

Add to production environment:
```
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxx
```

**Note:** If using a personal account (not a team), leave `VERCEL_TEAM_ID` unset.

### NEXT_PUBLIC_DOMAIN

Set the base domain for constructing subdomain URLs:

```
NEXT_PUBLIC_DOMAIN=ugc.community
```

---

## 4. Testing the Configuration

### Test DNS Resolution

```bash
# Test that wildcard DNS resolves
nslookup test-random-subdomain.ugc.community

# Should resolve to Vercel's servers
```

### Test Vercel API Connection

From the project directory with environment variables set:

```bash
# Verify API token works
curl -H "Authorization: Bearer $VERCEL_API_TOKEN" \
  "https://api.vercel.com/v9/projects?teamId=$VERCEL_TEAM_ID"
```

### Test Full Flow

1. Create a test creator in the admin panel
2. Assign them a subdomain (e.g., `test-creator`)
3. Create/connect their Vercel project
4. Click "Enable Site" in admin panel
5. Visit `https://test-creator.ugc.community`
6. Verify the site loads with valid SSL

---

## 5. Creator Setup Workflow

Once infrastructure is configured, the workflow for adding a new creator:

### From Admin Panel

1. **Create User Account** (if not exists)
   - User signs up or admin creates account

2. **Claim Subdomain**
   - User claims subdomain via profile settings, OR
   - Admin assigns subdomain via admin panel

3. **Create Vercel Project**
   - Create new project in Vercel dashboard
   - Note the Project ID

4. **Link to Creator**
   - In admin panel → User detail page
   - Enter Vercel Project ID
   - Optionally link GitHub repository

5. **Enable Site**
   - Toggle "Site Enabled" in admin panel
   - This adds the subdomain to the Vercel project via API

### Via GitHub Actions (Automated)

See [Creator Repository Setup](./creator-repo-setup.md) for the automated workflow using GitHub Actions and `creator.json`.

---

## Troubleshooting

### Domain Shows "Pending Verification"

- Verify DNS CNAME record is correctly configured
- Wait for DNS propagation (check with `dig` command)
- Click "Refresh" in Vercel dashboard

### SSL Certificate Not Issuing

- Ensure DNS is correctly pointing to Vercel
- Check for CAA records that might block Let's Encrypt
- Vercel automatically retries certificate provisioning

### API Returns 403 Forbidden

- Verify `VERCEL_API_TOKEN` is valid and not expired
- Check token scope includes the project
- Verify `VERCEL_TEAM_ID` is correct (if using team)

### Subdomain Returns 404

- Verify the specific subdomain is added to the Vercel project (not just wildcard)
- Check the creator's `siteEnabled` flag in database
- Verify the Vercel project has deployments

### DNS Propagation Issues

```bash
# Check DNS from different resolvers
dig @8.8.8.8 subdomain.ugc.community
dig @1.1.1.1 subdomain.ugc.community

# Clear local DNS cache (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## Architecture Reference

```
                    ┌─────────────────────────────────────────┐
                    │           DNS Provider                  │
                    │  *.ugc.community → cname.vercel-dns.com │
                    └─────────────────────────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │              Vercel Edge                │
                    │  Routes requests based on Host header   │
                    └─────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │ johndoe.ugc...  │ │ creator2.ugc... │ │ ugc.community   │
          │ (Creator Site)  │ │ (Creator Site)  │ │ (Main Platform) │
          │ Vercel Project  │ │ Vercel Project  │ │ Vercel Project  │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Security Considerations

- **API Token Security**: Store `VERCEL_API_TOKEN` securely; rotate periodically
- **Domain Validation**: Subdomains are validated against reserved words and profanity before assignment
- **Rate Limiting**: Vercel API has rate limits; batch operations when possible
- **SSL**: All subdomains automatically get SSL via Vercel's Let's Encrypt integration

---

## Related Documentation

- [Creator Repository Setup](./creator-repo-setup.md) - GitHub Actions auto-registration
- [Portfolio Contact Integration](./portfolio-contact-integration.md) - Contact form API
- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel API Reference](https://vercel.com/docs/rest-api)
