CREATE INDEX IF NOT EXISTS board_jobs_owner_created ON board_jobs(submitter_user_id, source_kind, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_job_time ON analytics_events(json_extract(properties, '$.jobId'), received_at);
