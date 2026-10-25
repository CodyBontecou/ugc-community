import assert from "node:assert/strict";
import { test } from "node:test";
import { GET as campaigns } from "../../app/api/jobs/route";
import { GET as milestones } from "../../app/api/user/milestones/route";
import { GET as rewards } from "../../app/api/user/rewards/route";
import { POST as onboarding } from "../../app/api/onboarding/route";
import { POST as generation } from "../../app/api/admin/questionnaires/[id]/generate/route";
import { GET as enforcement } from "../../app/api/cron/portfolio-enforcement/route";
import { GET as monitoring } from "../../app/api/cron/profile-monitoring/route";

test("retired creator-program endpoints stop work and point clients to job-board tools", async () => {
  for (const handler of [campaigns, milestones, rewards, onboarding, generation, enforcement, monitoring]) {
    const response = handler();
    assert.equal(response.status, 410);
    const body = await response.json();
    assert.match(body.error, /retired/);
    assert.equal(body.dashboard, "/dashboard");
    assert.equal(body.profile, "/apply-profile");
    assert.equal(body.jobs, "/jobs");
  }
});
