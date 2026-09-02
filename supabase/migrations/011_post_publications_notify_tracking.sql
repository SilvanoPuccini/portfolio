-- Migration 011: Newsletter delivery tracking on post_publications
-- Without this, a failed Resend call left the post published with the mail
-- silently never sent and nothing to retry from. notified_at stays the
-- idempotency key; these two columns make failures visible and retryable.

ALTER TABLE post_publications
  ADD COLUMN IF NOT EXISTS notify_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notify_error    text;

-- El cron levanta pendientes de envío: publicados que nunca notificaron.
CREATE INDEX IF NOT EXISTS idx_post_publications_pending_notify
  ON post_publications (status, notified_at)
  WHERE notified_at IS NULL;
