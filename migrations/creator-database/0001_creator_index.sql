CREATE TABLE creator_imports (
  object_key TEXT PRIMARY KEY,
  etag TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  accepted INTEGER NOT NULL,
  rejected INTEGER NOT NULL
);
CREATE TABLE creator_matches (
  object_key TEXT NOT NULL,
  etag TEXT NOT NULL,
  record_id TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  evidence TEXT NOT NULL,
  confidence TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  PRIMARY KEY (object_key, etag, record_id)
);
CREATE INDEX creator_matches_author ON creator_matches(author);
CREATE INDEX creator_matches_version ON creator_matches(object_key, etag);
CREATE TABLE creator_import_errors (
  object_key TEXT PRIMARY KEY,
  etag TEXT NOT NULL,
  message TEXT NOT NULL,
  failed_at TEXT NOT NULL
);
-- Suppression is independent of the input objects, so later uploads cannot
-- reintroduce a removed author. Only the owner's admin tooling may change it.
CREATE TABLE creator_suppressions (author TEXT PRIMARY KEY, created_at TEXT NOT NULL);
CREATE TABLE creator_sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  incremental_cursor TEXT,
  exports_cursor TEXT,
  lease_token TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  last_run_at TEXT,
  last_completed_at TEXT
);
INSERT INTO creator_sync_state (id) VALUES (1);
