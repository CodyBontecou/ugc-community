ALTER TABLE board_jobs ADD COLUMN application_email TEXT;
CREATE TABLE board_creator_profiles (
  user_id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  profile_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE board_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES board_jobs(id),
  user_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  reply_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','sending','sent','failed')),
  created_at TEXT NOT NULL,
  lease_until TEXT,
  provider_id TEXT,
  UNIQUE(job_id, user_id)
);
CREATE INDEX board_applications_user ON board_applications(user_id, created_at);
