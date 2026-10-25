-- Cloudflare Email does not offer a provider idempotency key. Only a definite
-- pre-acceptance rejection may be retried; legacy failed sends need checking.
ALTER TABLE board_applications ADD COLUMN failure_retryable INTEGER NOT NULL DEFAULT 0;
