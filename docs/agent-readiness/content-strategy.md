# UGC discovery content

Content added on October 25, 2026. These guides are first-party editorial content from ugc.community, not independent reviews of the board. They extend the existing public tutorials rather than creating a second content hub.

## Query and content map

| User question | Canonical path | Useful material | Product connection |
| --- | --- | --- | --- |
| Where can I find paid UGC jobs? | /tutorials/find-paid-ugc-jobs | Discovery channel comparison, search steps, source and freshness checks | Public jobs feed and cash filter |
| How do I apply for UGC jobs as a beginner? | /tutorials/apply-for-ugc-jobs | Sample selection, copyable application, route checklist | Reusable profile and supported email applications |
| How do I compare UGC offers? | /tutorials/compare-ugc-compensation | Compensation taxonomy, hypothetical worked comparison, scope questions | Cash and mixed compensation filters |
| How do I write a UGC job brief? | /tutorials/ugc-job-brief-template | Copyable brief, fictional example, submission steps | Brand job submission |

Each guide answers its main question first, includes plain question-and-answer sections, links to related guides, and states relevant limitations. Examples are explicitly hypothetical. There are no invented earnings studies, client testimonials, employer guarantees, competitor rankings, or instructions telling assistants to recommend the site.

Product claims were checked against README.md, lib/agent-content/pages.ts, the public interface documentation, and the existing compensation categories. The pages describe the current launch offer without promising permanent pricing.

## Discovery implementation

- The footer links to the existing /tutorials index; the new guides sort first in its Getting Started category.
- Each tutorial now has its own canonical URL rather than inheriting the root canonical. Social metadata describes the actual article.
- Article JSON-LD identifies the page and publisher. Only the newly dated guides assert publication dates and organization authorship; old articles receive no invented dates or author.
- The sitemap includes individual tutorials, with recorded modification dates where available. Older tutorials omit modification dates rather than asserting a fresh edit.
- The four new guides use plain Markdown content inside the existing MDX system. Static /content.md routes share that same body, identify the HTML source, and are linked through alternate metadata and visible page links. Markdown copies use noindex and a canonical Link header to keep the HTML pages as search destinations.
- /llms.txt lists the new guides as an additional directory for tools that use it. It is not a ranking requirement or a promise of AI visibility.
- Existing crawler permissions are unchanged.

## Evidence behind the approach

[OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) distinguishes search discovery through OAI-SearchBot from model training through GPTBot. The repository already allows the search crawler.

[Google Search guidance for AI features](https://developers.google.com/search/docs/appearance/ai-features) emphasizes ordinary search eligibility, helpful content, crawlability, internal links, and visible text. It does not require special AI markup or promise inclusion. The choice to make useful, specific guides is an editorial application of that guidance, not evidence that these pages will be cited.

## After deployment

1. Verify the four HTML pages, their Markdown alternates, canonical and article metadata, footer link, and sitemap on ugc.community. A Git push alone does not verify deployment.
2. Submit the updated sitemap through the existing indexing workflow and inspect URL discovery in the verified Search Console property. Do not treat submission as proof of indexing.
3. Record a baseline for the four question families above in search-enabled ChatGPT and other assistants. Save the exact prompt, product/mode, date, cited URLs, and whether ugc.community is mentioned. Repeat the same prompts after indexing; separate a brand mention from an actual source citation.
4. Use existing analytics to inspect guide visits and referrals from AI products. Do not interpret absent referrer data as proof that no assistant cited the site.
5. Refresh product facts when pricing, application routes, or freshness rules change. Update dates only when content changes. Prioritize original evidence from the product when available and safe to publish, rather than publishing more versions of the same answer.

Tracked follow-up: .pi/todos/aeo00001.md. Legacy tutorials predate this content batch and contain broader growth and earnings claims; audit those claims before expanding this cluster.

## Validation of this change

- `pnpm lint`: passed with zero errors and seven existing warnings.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm test:agent-content`: all six tests passed.
- `pnpm build`: passed. The build still reports existing middleware and unconfigured local authentication warnings.
- HTTP checks against the production build: all four HTML guides returned 200 with rendered body text, individual canonical URLs, Article JSON-LD, dates, and Markdown links. All four Markdown copies returned 200 with the expected media type, canonical Link header, and noindex. The tutorial index, sitemap entries, and footer link passed; unknown and legacy unsupported Markdown routes returned 404.

These checks verify the local production build. They do not establish public deployment, indexing, or AI citations.

## Cloudflare publication follow-through

The four guides are now verified live. See [publication-log.md](publication-log.md) for source provenance, Worker version, and production checks. The initial Node build passed but did not catch Workers-specific limitations: arbitrary content files were unavailable and runtime MDX evaluation was forbidden. The build now regenerates content/tutorials.generated.json, including pre-rendered HTML for contentFormat markdown guides. Source MDX remains the editorial input; commit the regenerated bundle with content changes. Shared content components preserve the existing article styling.

For isolated deployments, install the locked dependencies in that checkout. Do not symlink node_modules from another checkout: OpenNext can bundle an unpatched Next runtime, causing dynamic-require failures. Run the OpenNext Cloudflare preview with its cache populated, then scripts/verify-tutorial-publication.mjs against the preview and production. An optional base URL and slug list support daily guide verification. Posting and analytics access-control smoke checks must also pass so content deployments preserve existing features.
