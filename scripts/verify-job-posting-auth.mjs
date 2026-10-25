import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const base = new URL(process.argv[2] || "https://ugc.community");
function check(label, path, expectedStatus, args = []) {
  const output = execFileSync("curl", ["--silent", "--show-error", "--max-time", "30", "--output", "/dev/null", "--write-out", "%{http_code}\\n%{redirect_url}", ...args, new URL(path, base).href], { encoding: "utf8" });
  const [status, redirect] = output.trim().split("\n");
  assert.equal(Number(status), expectedStatus, `${label}: expected ${expectedStatus}, received ${status}`);
  console.log(`PASS ${label}: ${status}`);
  return redirect;
}

// No cookies, credentials, valid job data, or email requests are sent.
const redirect = check("Anonymous posting page", "/post-job", 307);
const destination = new URL(redirect, base);
assert.equal(destination.origin, base.origin);
assert.equal(destination.pathname, "/sign-in");
assert.equal(destination.searchParams.get("callbackUrl"), "/post-job");
const post = ["--request", "POST", "--header", "Content-Type: application/json", "--header", `Origin: ${base.origin}`];
check("Anonymous submission", "/api/job-board/submissions", 401, [...post, "--data", "{}"]);
check("Authentication precedes body validation", "/api/job-board/submissions", 401, [...post, "--data", "invalid json"]);
check("Public job browsing", "/jobs", 200);
check("Sign-in destination", "/sign-in?callbackUrl=/post-job", 200);
