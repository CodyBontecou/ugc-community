# UGC content publication log

## October 25, 2026 — initial four guides

Status: **published and verified on ugc.community**.

| Guide | Public URL |
| --- | --- |
| Where to find paid UGC jobs and compare opportunities | https://ugc.community/tutorials/find-paid-ugc-jobs |
| How to apply for UGC jobs as a beginner | https://ugc.community/tutorials/apply-for-ugc-jobs |
| How to compare UGC job pay and deliverables | https://ugc.community/tutorials/compare-ugc-compensation |
| UGC job brief template for brands hiring creators | https://ugc.community/tutorials/ugc-job-brief-template |

- Content commit: `e4129d1`. Runtime fix: `91760ac`.
- Deployed source: clean archive of `2f34c8c` with the owned tutorial runtime changes from `91760ac` applied. The later unrelated job-review changes in `2eda5fa` and ongoing uncommitted performance changes were excluded. Committed analytics from `2e9bdca` and `a50e9c2` are included.
- Successful Cloudflare Worker version: `4b5642d7-940c-41ce-8e01-a02d82c6fc41`.
- Initial failed activation `c0e6b701-8d59-4977-a2ad-9991fadf9371` was rolled back to `f209bbce-6953-4c69-977d-43e746ee789e` during diagnosis. The corrected bundle passed local Cloudflare preview before deployment.
- All four production HTML pages and Markdown copies returned 200 with rendered body text, dates, individual canonicals, and Article metadata. The index, footer discovery link, and sitemap include the guides. Unknown and unsupported Markdown routes return 404.
- Posting checks passed: anonymous posting page 307 to sign-in; anonymous submissions 401; public jobs and sign-in 200.
- Analytics checks passed: report APIs 401, private dashboard paths 307, missing origin rejected, and DNT/GPC honored. The separate analytics chat owns the two-account test fixtures and their cleanup.
- IndexNow accepted 15 recently modified sitemap URLs, including all four guides, with HTTP 200. This confirms submission acceptance, not indexing or AI citations.
- Daily publication automation is active for 9:00 AM America/Puerto_Rico and now includes the Cloudflare build/preview requirements. Do not republish this initial batch as a new daily article.

Reproduce checks with `node scripts/verify-tutorial-publication.mjs`, `node scripts/verify-job-posting-auth.mjs`, and `node scripts/verify-analytics-auth.mjs`. To check a new daily article, pass the origin and slug: `node scripts/verify-tutorial-publication.mjs https://ugc.community YOUR_SLUG`.
