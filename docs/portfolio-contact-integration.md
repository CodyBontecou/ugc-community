# Portfolio Contact Form Integration

This portfolio site needs a contact form that sends inquiries through ugc.community's email service.

## API Endpoint

```
POST https://ugc.community/api/portfolio/contact
```

## Request Format

```typescript
interface ContactFormRequest {
  name: string;        // Sender's name (required, max 100 chars)
  email: string;       // Sender's email (required, valid email)
  company: string;     // Brand/company name (required, max 100 chars)
  message: string;     // Project details (required, max 5000 chars)
  creatorSubdomain: string;  // The creator's subdomain, e.g. "daniela" for daniela.ugc.community
}
```

## Response Format

**Success (200):**
```json
{ "success": true, "message": "Message sent successfully" }
```

**Error (400/404/429/500):**
```json
{ "error": "Error message here" }
```

## Implementation

Create a contact form with fields:
- Your Name
- Email Address
- Brand / Company
- Project Details (textarea)

On submit:

```typescript
async function handleSubmit(formData: {
  name: string;
  email: string;
  company: string;
  message: string;
}) {
  const res = await fetch('https://ugc.community/api/portfolio/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      creatorSubdomain: 'CREATOR_SUBDOMAIN_HERE'  // Replace with actual subdomain
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to send message');
  }

  return data;
}
```

## What Happens on Submit

1. The creator receives an email with the inquiry details and a reply button
2. The sender receives a confirmation email thanking them for reaching out

## Notes

- CORS is configured to allow requests from `*.ugc.community` subdomains
- The `creatorSubdomain` must match an existing user's subdomain in the database
- Rate limiting is enforced server-side (you may receive `429` if submitting too frequently)
- Form validation should happen client-side before submission for better UX
