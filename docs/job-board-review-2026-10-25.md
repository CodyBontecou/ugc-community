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

SideShift sources require manual recapture/rereview before the existing seven-day expiry. The Reddit refresh manifest has a tested source-key filter so unsupported SideShift URLs are not sent to Subscrape. The filter was integrated with the active Lighthouse release, version 2c58d6e5-5c48-4530-8f49-ecca37e5155c, deployed at 2026-10-25T17:10:14Z. Live verification returns 30 Reddit sources, zero SideShift targets and truncated=false. The existing UI and posting authentication guard were preserved. Issue #8 is complete.

Validation: 38 job-board tests passed, repository lint passed with seven existing warnings, and TypeScript/production builds passed. The isolated Worker rendered `/docs` and `/guide`. OpenNext logged an existing package-export transformation warning for string exports; the packages were present and those routes rendered successfully. Live posting smoke checks pass 307 for anonymous `/post-job`, 401 before submission body validation, and 200 for public jobs/sign-in. `/api/inngest` returns 410. The final coordinated release passed those same posting smoke checks and the Reddit-only refresh assertion; the public jobs API still reports 37 opportunities.

## Infrastructure follow-up

Fly sign-in succeeded. The only accessible organization is personal, and the legacy `ugc-community-worker` app is absent from its account-wide app list; direct status lookup also cannot find it. The manually dispatched Fly deploy workflow was disabled with explicit user approval. No unrelated Fly app, stored creator record, hosted file or provider credential was deleted. Inngest sign-in and Neon/Blob inventory access remain unresolved in #6; see `legacy-infrastructure.md` and the aggregate read-only inventory command.

## Complete source classification after upload reconciliation

The screenshot's 1,496 count was the number of selected export records before server-side deduplication. The exact R2 object `incremental/subscrape-filtered-1792940377333.jsonl` contains 784 records: 758 unique source posts/comments and 26 contact/link matches. Its production checkpoint records 758 accepted sources, 26 legacy records and zero rejected inputs; no import errors were present.

Every one of those 758 source bodies was subsequently read in full and classified directly by the Codex chat model. This is distinct from the earlier rule-based recovery scan: no Jev or OpenAI classification API was called, because no API credential was configured. Post titles supplied context; employer follow-ups were checked against the archived parent author's identity. Certainty labels are qualitative, not calibrated probabilities. These classifications describe the uploaded archive; 15 source revisions have since been superseded and must not overwrite current evidence.

| Classification | Source records |
| --- | ---: |
| Applicant responses | 367 |
| Creator service pitches | 63 |
| Discussion/advice | 206 |
| Community administration | 30 |
| Employer hiring offers | 45 |
| Performance/commission offers | 7 |
| Incomplete hiring inquiry | 1 |
| Employer application follow-ups | 18 |
| Platform/network invitations | 5 |
| Broader creator/research roles | 4 |
| Opportunity referrals | 2 |
| Multi-campaign roundup | 1 |
| Insufficient body/context | 9 |
| **Total** | **758** |

These are source categories, not counts of unique verified jobs. Individual source reasons, qualitative certainty, original classifications, source/body hashes, original dates, database review states and revision comparisons are retained privately in `.wrangler/classification/classified-758-sources.json`. Raw source bodies, applicant contact details and classifier results were not published to the repository or public API.

Two previously unqueued leads were found. A buyer's employment-webapp creator inquiry (`reddit:1xee0vq:19rlcnfmv6s0x`, previously `other`) is now a private pending record, held for employer identity, compensation, deliverables and application evidence. A one-hour $100 USD CapCut workflow-testing offer (`reddit:1x9waxa:phql31g`, previously `creator_self_promotion`) is retained separately as paid research, since it explicitly requests no promotional content. Both follow-ups are recorded in #7; no outreach or applications were submitted.

Final database verification: 82 records, comprising 37 published, 21 pending, 23 rejected and one closed internal test. Existing decisions, raw source labels/revisions and original dates were preserved. Classification did not publish or renew any job. Coverage validation confirmed 758 unique identities, one nonempty decision per identity, exact body hashes and label totals summing to 758.

## Board reconciliation after classification

Applied classification annotations to 18 pending records whose current source revision matches the reviewed archive, preserving previous review evidence and advancing review concurrency timestamps. Superseded source revisions were skipped. Added the CapCut workflow-testing offer as a private pending record with the stated USD $100 payment, one-hour scope, original October 19 posting date and October 25 capture date. It is explicitly described as paid research rather than promotional UGC, with no verification timestamp. Employer, current availability (the archive says “this week”) and research/data-use terms remain unresolved. Attempts to retrieve the live original through web access failed, so no new availability evidence was asserted.

Verified production totals after the update: 83 records — 37 published, 22 pending review, 23 rejected and one closed test. The employment-webapp inquiry remains privately pending. No published decision, source revision or freshness timestamp was changed. Issue #7 tracks the remaining evidence requirements. No application code or deployment changed.

## Publication with undisclosed employers

The user explicitly approved publishing otherwise supported offers with the company label “Employer not disclosed,” while retaining substantive incomplete or conflicting offers privately. Published eight: US expecting-mom two-video collaboration; cleaning-app monthly videos; fashion videos; study-tool referral; coffee cooking test; skincare videos; roommate-app fifteen-video package; and haircare sales commission. Every new public record uses that exact disclosure and a reviewed summary. Dollar signs without an explicit currency remain unspecified, package versus per-video rates are distinguished, and affiliate/bonus earnings are not treated as guaranteed base pay. Missing external usage terms remain missing.

Fourteen external records remain pending for actual missing payment/scope/application evidence, conflicting packages, unresolved duplication, or uncertain timing. Private notes and #7 now describe those reasons rather than employer-name absence. Internal QA records from another chat were excluded from review and left untouched.

Publication exposed a narrow review-tool bug: original-thread applications explicitly saying “Comment with your portfolio” were rejected because the archive gate recognized DM/email instructions only. Added explicit comment/reply application matching, retaining original-source URL and source-revision/freshness checks. A D1 integration test reproduced the rejection before the fix, then verified successful original-thread publication, rejection of an unrelated application URL, exact undisclosed-employer label, and capture-capped freshness. All 40 job-board tests, targeted lint, TypeScript and the production build passed. The build reported existing missing local auth environment warnings. No application deployment was necessary; publication ran through the local review CLI against production D1.

Live paginated public API verification independently returned 45 total jobs and all eight new IDs with the exact employer disclosure. Database verification confirms 45 published external records, 14 pending external records and 23 rejected external records.
