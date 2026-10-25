CREATE TABLE board_jobs (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL CHECK(source_kind IN ('external','direct')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','published','rejected','closed')),
  source_key TEXT UNIQUE,
  campaign_key TEXT UNIQUE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  compensation_type TEXT NOT NULL DEFAULT 'unspecified',
  compensation_text TEXT NOT NULL DEFAULT '',
  cash_amount REAL,
  deliverables TEXT NOT NULL DEFAULT '',
  eligibility TEXT NOT NULL DEFAULT '',
  usage_rights TEXT NOT NULL DEFAULT '',
  application_url TEXT NOT NULL DEFAULT '',
  closing_at TEXT,
  source_url TEXT,
  source_published_at TEXT,
  captured_at TEXT,
  verified_at TEXT,
  review_notes TEXT NOT NULL DEFAULT '',
  submitter_user_id TEXT,
  submitter_email TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX board_jobs_public ON board_jobs(status, source_kind, published_at);
CREATE TABLE board_sources (
  source_key TEXT PRIMARY KEY,
  revision TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  full_text TEXT NOT NULL,
  published_at TEXT,
  captured_at TEXT NOT NULL,
  content_status TEXT NOT NULL,
  classification TEXT NOT NULL
);
CREATE TABLE board_observations (
  source_key TEXT NOT NULL,
  revision TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  published_at TEXT,
  has_full_text INTEGER NOT NULL,
  candidate INTEGER NOT NULL,
  PRIMARY KEY(source_key, revision)
);
CREATE TABLE board_imports (object_key TEXT PRIMARY KEY, etag TEXT NOT NULL, imported_at TEXT NOT NULL, source_records INTEGER NOT NULL, legacy_records INTEGER NOT NULL, rejected INTEGER NOT NULL);
CREATE TABLE board_import_errors (object_key TEXT PRIMARY KEY, message TEXT NOT NULL, failed_at TEXT NOT NULL);
CREATE TABLE board_sync_state (id INTEGER PRIMARY KEY CHECK(id=1), incremental_cursor TEXT, exports_cursor TEXT, lease_token TEXT, lease_until INTEGER NOT NULL DEFAULT 0, last_completed_at TEXT);
INSERT INTO board_sync_state(id) VALUES (1);
CREATE TABLE board_validation_window (id INTEGER PRIMARY KEY CHECK(id=1), starts_at TEXT NOT NULL, ends_at TEXT NOT NULL);
INSERT INTO board_validation_window SELECT 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now','+14 days');
-- Historical supply yield survives normal expiry/closure; rejected or mistaken
-- qualifications can be invalidated without counting the same campaign twice.
CREATE TABLE board_qualifications (campaign_key TEXT PRIMARY KEY, job_id TEXT NOT NULL, qualified_at TEXT NOT NULL, first_seen_at TEXT NOT NULL, source_published_at TEXT NOT NULL, invalidated_at TEXT);
