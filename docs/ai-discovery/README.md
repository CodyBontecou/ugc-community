# AI discovery tracking

We measure two independent signals: sampled assistant responses and consented visits attributed to AI sources. Neither establishes what every user sees in a private chat.

## Initial baseline — October 25, 2026

The same unbranded paid-jobs prompt was run in a fresh unpersonalized temporary ChatGPT conversation (visible model: Instant) and a signed-out Gemini conversation (visible model: Flash-Lite). Both showed recommendations and citations, and neither mentioned or cited ugc.community. Perplexity required sign-in before returning an answer. Claude and Copilot were not tested. These are two completed observations, not a claim about all AI products or all four target questions.

Evidence and machine-readable status are in baseline/. probes.json contains the fixed prompts and protocol. Do not count blocked or untested combinations as negative results. The raw assistant response captures are evidence of what was displayed; their competitor claims are not independently verified research.

The production traffic snapshot at 17:59 UTC found no retained analytics events. It confirms an empty measured dataset at that moment, not an absence of site visitors or AI referrals. Existing test events had been cleaned up separately. Collection is recent, optional, and cannot backfill earlier visits.

## Referral measurement

The existing consented analytics collector recognizes ChatGPT, Perplexity, Claude, Copilot, and Gemini by referrer hostname. The extension in this change also recognizes exact allowed AI utm_source values on same-origin landing URLs when the referrer is missing. An actual referrer takes precedence. Only the coarse source category is saved; full referring URLs, conversation identifiers, arbitrary query values, and personal data are excluded. UTM labels are self-reported attribution, not proof that an assistant recommended the site.

/tutorials and the generated allowlist of published plain Markdown article paths are now eligible for collection. Unknown or private-looking paths remain excluded. The content generator updates the small tutorial-paths.generated.json manifest during builds, without loading full article bodies into the analytics browser bundle. Consent, DNT/GPC, account isolation, and bot handling remain in force.

Run the aggregate report with:

```sh
node --import tsx scripts/report-ai-acquisition.ts --remote --output .local/ai-discovery/reports/YYYY-MM-DD-traffic.json
```

The report reads production D1 and writes only aggregate counts. It includes source, first tracked page, measured sessions, pageviews, apply clicks, consented provider-accepted email applications, and job submissions. Seven completed Puerto Rico calendar days are compared with the preceding seven; today's partial totals remain separate. A session is not a person. Referrerless and untagged visits remain direct/unknown. Google/Bing visits cannot be labeled Gemini/Copilot or AI Overview visits from their hostname alone.

The report's entry path means the first tracked browser event within that period, which may follow an earlier unmeasured landing or cross a period boundary. Outcomes are associated with the measured session, not proof of causation or a hire. Referrer spoofing, tags, bots evading filters, blockers, consent refusal, privacy signals, and storage failures limit interpretation. An unavailable query is a failed report, never a zero report.

## Recurring checks

- Daily at 11:00 AM America/Puerto_Rico: read aggregate traffic, preserve a dated snapshot, and compare with prior observations.
- Sundays during that run: repeat the fixed unbranded prompts in independent conversations across accessible AI chat products. Save actual response/citation evidence and visible model/mode labels. Disable personalization when possible; record it otherwise. Do not replace a blocked consumer chat with a different API or a general search result and describe it as the same test.
- Notify on the first confirmed citation, first measured AI referral, meaningful sustained changes, or a failure requiring action. Stay quiet when unchanged or the data remains insufficient. Keep traffic, mentions, and citation counts separate; never calculate a response visibility percentage using unavailable combinations as its denominator.

The automation must not create accounts, buy monitoring services, or publish private analytics to the site. Recurring traffic snapshots and response captures belong in the ignored .local/ai-discovery/ directory and this chat, not Git. The committed initial baseline contains no retained visitor events. Credential-dependent platforms remain explicitly unavailable until accessible.

## Validation and rollout

Focused tests cover public guide path eligibility, rejection of unknown paths, exact UTM matching, referrer precedence, session deduplication, entry attribution, outcome association, and complete versus partial date windows. Run pnpm test:analytics, pnpm exec tsc --noEmit, and pnpm lint. Verify production collection with one clearly labeled synthetic event only if needed, remove exactly that event afterward, and keep it outside organic traffic comparisons. Do not manufacture mentions or visits.
