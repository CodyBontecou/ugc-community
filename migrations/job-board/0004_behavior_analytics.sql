-- Anonymous, consented product telemetry. No account IDs, IPs, or form values.
CREATE TABLE IF NOT EXISTS analytics_events (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  source TEXT NOT NULL,
  device TEXT NOT NULL,
  properties TEXT NOT NULL DEFAULT '{}',
  origin TEXT NOT NULL CHECK (origin IN ('browser', 'server')),
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS analytics_events_time ON analytics_events(received_at);
CREATE INDEX IF NOT EXISTS analytics_events_session ON analytics_events(session_id, sequence);
CREATE INDEX IF NOT EXISTS analytics_events_name_time ON analytics_events(name, received_at);
