# Brand icons

The icon uses the site's coral (`#FF9A8B`) to rose (`#FF6B95`) gradient and a warm cream (`#FFFBF9`) lowercase “u” with a community dot. Rounded strokes keep the mark readable at favicon sizes.

Edit `public/brand/icon.svg`, then run `pnpm icons:generate` to regenerate:

- `app/icon.png`: 512 px icon, also used by the site footer.
- `app/apple-icon.png`: 180 px touch icon with a full square background for Apple's corner mask.
- `app/favicon.ico`: 16, 32, and 48 px browser icons.

Next.js exposes these files and adds the icon links through its file-based metadata convention. Commit the source and generated files together.
