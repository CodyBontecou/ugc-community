{
  "id": "brand001",
  "title": "Deploy app-wide icon updates after Cloudflare login renewal",
  "tags": ["branding", "deployment"],
  "status": "open",
  "created_at": "2026-10-25T12:00:00Z"
}

Branding commit `8dba61c` is pushed. It adds shared React wordmarks, email header branding, the portfolio badge icon, and an updated social preview. Lint passed with existing warnings, the Cloudflare build passed, 27 job-board tests passed, and 11 public routes rendered the new wordmark locally.

Production deployment stopped before upload because the saved Wrangler OAuth session expired. Automatic approval rejected renewing the broad saved Cloudflare scopes, including after verifying they match the existing configuration. Obtain explicit user approval for that OAuth renewal before retrying it. Then deploy and check live wordmarks, the versioned social preview, and auth health. Rebuild first if source changes.
