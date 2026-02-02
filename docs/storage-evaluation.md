# Storage Evaluation: Cloudflare R2 vs Vercel Blob

## Current Status
Currently using Vercel Blob Storage for media files.

## Quick Comparison

| Feature | Vercel Blob | Cloudflare R2 |
|---------|-------------|---------------|
| Storage | $0.02/GB/mo | $0.015/GB/mo |
| Egress | $0.15/GB | FREE |
| Image Optimization | Built-in | Requires Workers |
| CDN | Global | Global |
| SDK | @vercel/blob | S3-compatible |

## Recommendation
**Keep Vercel Blob for now**

### Reasons:
1. **Simplicity**: Vercel Blob is deeply integrated with our Next.js deployment
2. **Image Optimization**: Built-in image optimization via Vercel
3. **Low Usage**: At current scale, cost difference is minimal
4. **Migration Effort**: Would require significant code changes

### Re-evaluate When:
- Monthly storage exceeds 10GB
- Monthly egress exceeds 50GB
- Vercel Blob costs exceed $50/month

## Future Migration Notes
If migrating to R2:
1. Update `lib/storage/` to use S3-compatible SDK
2. Set up Cloudflare Workers for image optimization
3. Migrate existing blobs
4. Update all URL references
