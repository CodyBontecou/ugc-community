import type { SourceSnapshot } from "./model";

// Discovery only: every matching source still needs the normal publication review.
export function isReviewCandidate(source: SourceSnapshot) {
  if (source.contentStatus !== "available") return false;
  if (["paid_ugc_job", "hiring_unconfirmed", "performance_only_offer"].includes(source.classification)) return true;
  if (source.classification !== "other" || !source.fullText.trim()) return false;
  // Use the body rather than a parent thread's title for applicant comments.
  const body = source.fullText.replace(/\\([*_\[\]])/g, "$1").replace(/[*_]/g, "").replace(/\s+/g, " ").toLowerCase();
  if (/\b(?:not hiring|no longer hiring|applications? (?:are )?closed)\b/.test(body)) return false;
  const employerIntent = /\b(?:we(?:['’](?:re|ll)| are| will)|i(?:['’]m| am))\b.{0,100}\b(?:hiring|recruiting|looking (?:for|with|to collaborate with)|pay)\b/.test(body);
  const creativeWork = /\b(?:ugc|creators?|videos?|reels?|shorts?|content)\b/.test(body);
  const application = /\b(?:dm|apply|email|comments?|contact|portfolio|send|message|tag)\b/.test(body);
  return employerIntent && creativeWork && application;
}
