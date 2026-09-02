-- Migration 009: Editorial agenda + publication state for posts
-- Holds the raw draft (title/content) before the post is hardcoded as MDX,
-- and the visibility state after it's deployed. The MDX/git/deploy workflow
-- itself is untouched — this table only tracks the agenda and what's visible.
-- Service-role Route Handlers are the only application access path.

CREATE TABLE IF NOT EXISTS post_publications (
  post_slug           text        PRIMARY KEY,
  status              text        NOT NULL DEFAULT 'planificado',
  raw_title           text        NOT NULL,
  raw_content         text,
  scheduled_at        timestamptz NOT NULL,
  notify_subscribers  boolean     NOT NULL DEFAULT true,
  pre_approved_at      timestamptz,
  published_at        timestamptz,
  notified_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_post_publications_slug CHECK (
    char_length(post_slug) BETWEEN 1 AND 120
    AND post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT chk_post_publications_status CHECK (
    status IN ('planificado', 'preaprobado', 'publicado')
  )
);

CREATE INDEX IF NOT EXISTS idx_post_publications_status_scheduled
  ON post_publications (status, scheduled_at);

ALTER TABLE post_publications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE post_publications FROM anon, authenticated;
