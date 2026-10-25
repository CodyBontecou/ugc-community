# Subscrape → ugc.community contract, version 1

Hourly uploads still contain full `type: source` records in private R2 `subscrape-exports/incremental/`. Hiring sources now also contain a `jobBoard` review draft. Existing contact and source records remain compatible; non-hiring sources have `jobBoard: null`. JSON/JSONL store objects; CSV stores the same object as JSON in the `jobBoard` column. No additional public bucket, endpoint, or model API is required.

See [the JSON Schema](../schemas/job-board-v1.schema.json) and [synthetic example](../schemas/job-board-v1.example.json). The schema describes a standalone feed envelope; each source's `jobBoard` object uses its `$defs.job` shape. The example uses fictional employer/contact data.

## Board field mapping

| Scraper draft | ugc.community |
|---|---|
| `sourceKey` / `id` | Stable `reddit:POST_ID:COMMENT_ID_OR_post` identity, used for source upserts |
| `campaignKey`, `sourceKeys`, `duplicateOf` | Suggested campaign key, all known source aliases, and canonical source identity |
| `company`, `title`, `description` | Review form / display draft; employer can be null; summary is an unreviewed text excerpt |
| `compensationType`, `compensationText`, `cashAmount` | Existing review fields; fixed amount stays null when uncertain |
| `pay.currency`, `currencySymbol`, `minimum`, `maximum`, `unit`, `evidence` | Extra explicit rate details; never interpret `$` as USD without evidence |
| `deliverables`, `eligibility`, `usageRights` | Source excerpts; empty means not stated / needs review |
| `applicationUrl`, `applicationMethod`, `applicationEvidence` | Form, website, or original Reddit page for source-stated email/DM/reply instructions |
| `sourcePublishedAt`, `capturedAt`, `editedAt` | Separate original, capture, and edit times, ISO UTC or null |
| `closingAt`, `closingText` | Only confirmed machine dates in `closingAt`; textual deadlines retained without guessing a date |
| `classification`, `reviewFlags`, `status`, `verified` | Category and review state; every draft is `pending_review`, `verified: false` |

`applicationEvidence` includes the archived source ID, URL and text supporting the destination. Only the employer's own post/comments/replies can supply these links. Applicant portfolios cannot become application URLs. Multiple competing destinations are left unresolved. `cashAmount` is the minimum of one explicit fixed rate/range; caps, gifts, commissions, potential earnings, conflicting rates, and ambiguous units are never guaranteed amounts. The full pay text is retained for review.

## Import and publication

1. Read the raw source record. Validate subreddit, Reddit URL, original date, content status and capture timestamp independently of the draft.
2. Accept UGCcreators, UGC_forhire, UGCconnect and ugc (case insensitive). Match the declared subreddit to the URL. Keep the existing canonical source identities; do not key by title, contact email or fetch timestamp.
3. Validate version 1 drafts and their source identity. Unknown/malformed drafts can be ignored while the raw archive remains importable. A draft cannot assert publication or verification.
4. Update sources by original source identity and latest capture, regardless of which R2 object contains them. Capture-only refreshes do not change meaningful source revision. Draft field changes do.
5. Suppress `duplicateOf` sources as separate candidates. Preserve raw evidence. Keep `campaignKey` as a *suggestion* until review; it must not reserve a published board campaign. Before publication, reconcile against existing campaign identities and source aliases. Application-specific SideShift job IDs are stable across referral codes. Fallback campaign keys can change when previously unknown crossposts merge; `sourceKey` remains stable, and `sourceKeys` supports reconciliation.
6. Prefill existing private review columns only on the current pending source revision. Never overwrite a published/rejected/closed listing by replaying a draft. Classification changes still follow existing withdrawal rules. Do not auto-publish or renew verification from metadata.
7. The board's existing reviewer validates employer, pay, application evidence and freshness. Missing usage/eligibility terms stay missing. Only approved, current jobs are public; full source text and classifier drafts stay private.

The importer update lives in ugc.community's `lib/job-board/model.ts`, `subscrape-draft.ts` and `sync.ts`. No D1 migration is needed. Existing older raw exports remain supported. The board already scans `incremental/` and `exports/`; sources from the newly accepted communities require a replay because earlier import checkpoints may record them as rejected. The importer versions its checkpoints so old objects replay once through the existing paginated sync after deployment. No source/job deletion or D1 schema migration is needed. Never insert fixture exports in production.

## Local inspection

```sh
node scripts/export-job-board.mjs /path/to/records-or-collections.json /path/to/job-board.json
```

The standalone feed contains unique offer drafts, with explicit classifications separating paid UGC, performance/affiliate, platform signup, broader creator roles, and unconfirmed hiring. Consumers choose the categories they display. It is a review feed, not an automatically approved public job API.
