# October 25 job-board follow-up

Tracked in issues [#6](https://github.com/CodyBontecou/ugc-community/issues/6), [#7](https://github.com/CodyBontecou/ugc-community/issues/7), and [#8](https://github.com/CodyBontecou/ugc-community/issues/8).

## Review results

The verified production inventory is 81 job records: 37 published, 20 pending review, 23 rejected and one closed internal test. The public API independently reports 37 opportunities. The final upload sync imported zero objects and reported zero failures; no production test jobs, applications or employer messages were created.

Four previously held briefs were resolved from live source evidence: Piatto's application form names the meal-planning app; the original recruiter's new link identifies Payday AI; NearbyCrew's directory supplies the named Synthopia $50 pilot; and a previously empty wellness/faith cross-post exposes the complete Lift/Vibly/Dopy/Sunrise revenue-share brief. Real capture timestamps and original Reddit posting dates were preserved. The link-post capture explicitly attributes the separately read destination brief.

All 11 roundup links were checked individually. The public application site's own `/api/jobs/:id` response supplies exact original dates and current terms, avoiding substitution of the roundup's date or old compensation claims. Eight campaigns were published: Airlearn, Cooked, Playad, Klastra, Solid, Bynor, GoTall and Sipra. Sternify remains held because the available description ends mid-sentence without a complete package scope. Erly remains held for conflicting posting counts and payment/package descriptions. The remaining YouTube link returns job-not-found and stays excluded.

Compensation is reviewed against the authored brief rather than provider badges. Sipra is affiliate commission, not guaranteed pay per post; Collect's $2,700 platform total is not treated as a guaranteed monthly salary. Missing external terms remain missing. Source-backed review does not establish independent employer legitimacy or guarantee payment.

Twenty evidence gaps remain in #7, including the two held roundup campaigns. No source clarification was invented to clear a hold. Source revisions arriving during the review withdrew six previously approved listings; each was reread and restored only after current evidence supported it.

## Implementation and checks

The importer now recovers eligible first-party hiring briefs classified as `other`, as well as performance-only source categories, into private review. The historical recovery scan examined 690 unqueued sources and found two additional roles; both were individually rejected as outside the current UGC-campaign scope. Unchanged replays do not reopen reviewed decisions. Five real missed-brief fixtures and D1 integration tests cover discovery and recovery.

The public SideShift capture adapter checks identity, retains exact source dates and stated terms, excludes applicant counters and unrelated account data, and imports private candidates only. Repeated IDs in an import batch use the latest capture. Publication uses the existing review, freshness, compensation and campaign-uniqueness checks. Missing dates remain unknown.

SideShift sources require manual recapture/rereview before the existing seven-day expiry. The Reddit refresh manifest has a tested source-key filter so unsupported SideShift URLs are not sent to Subscrape. Integrate that filter with the active Lighthouse release before closing #8; another release replaced the earlier filtered artifact. No full shared-checkout deployment should overwrite another chat's UI or authentication work.

Validation: 38 job-board tests passed, repository lint passed with seven existing warnings, and TypeScript/production builds passed. The isolated Worker rendered `/docs` and `/guide`. OpenNext logged an existing package-export transformation warning for string exports; the packages were present and those routes rendered successfully. Live posting smoke checks pass 307 for anonymous `/post-job`, 401 before submission body validation, and 200 for public jobs/sign-in. `/api/inngest` returns 410. Repeat the posting smoke check and assert Reddit-only refresh targets after the final coordinated release.

## Infrastructure follow-up

Fly sign-in succeeded. The only accessible organization is personal, and the legacy `ugc-community-worker` app is absent from its account-wide app list; direct status lookup also cannot find it. The manually dispatched Fly deploy workflow was disabled with explicit user approval. No unrelated Fly app, stored creator record, hosted file or provider credential was deleted. Inngest sign-in and Neon/Blob inventory access remain unresolved in #6; see `legacy-infrastructure.md` and the aggregate read-only inventory command.
