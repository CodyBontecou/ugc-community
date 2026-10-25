# Brand icons

The icon uses the site's coral (`#FF9A8B`) to rose (`#FF6B95`) gradient and a warm cream (`#FFFBF9`) lowercase “u” with a community dot. Rounded strokes keep the mark readable at favicon sizes.

Edit `public/brand/icon.svg`, then run `pnpm icons:generate` to regenerate:

- `app/icon.png`: 512 px icon, also used by email headers and hosted portfolio badges.
- `app/apple-icon.png`: 180 px touch icon with a full square background for Apple's corner mask.
- `app/favicon.ico`: 16, 32, and 48 px browser icons.

Next.js exposes these files and adds the icon links through its file-based metadata convention. Commit the source and generated files together.

Use `BrandLink` from `components/brand-link.tsx` whenever a React page displays the ugc.community wordmark. It includes a decorative icon and a single accessible text label. It supports a destination, light text for dark backgrounds, and the footer's larger icon size. Headers, information/legal pages, creator profiles, and the footer share this component.

Email templates use `emailBrandMark()` from `lib/email/brand.ts`, with a presentation table and an absolute PNG URL for email-client compatibility. Hosted portfolio badges use the same PNG. Brand mentions in prose, page titles, copyright notices, social handles, URLs, and plain-text email remain text.

The Open Graph and Twitter preview card at `public/social-preview.png` also includes the icon. Its metadata URL includes a brand version to refresh cached link previews.
