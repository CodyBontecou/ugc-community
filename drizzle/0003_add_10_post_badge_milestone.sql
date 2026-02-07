-- Add a "Rising Creator" badge milestone at 10 lifetime posts.
-- This badge is automatically removed once the user earns the Verified Badge (100 posts).
INSERT INTO "milestones" ("id", "type", "threshold", "name", "description", "reward_type", "reward_config", "display_order")
VALUES (
  gen_random_uuid(),
  'lifetime',
  10,
  'Rising Creator',
  'Earned by reaching 10 lifetime posts. A stepping stone on the path to Verified status.',
  'badge',
  '{"badge_type": "rising_creator", "replaced_by_badge": "verified"}'::jsonb,
  0
);
