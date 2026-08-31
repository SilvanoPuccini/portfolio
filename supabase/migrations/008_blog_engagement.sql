-- Migration 008: Anonymous per-post engagement
-- Service-role Route Handlers are the only application access path.

CREATE TABLE IF NOT EXISTS post_reactions (
  post_slug   text        NOT NULL,
  visitor_hash text       NOT NULL,
  reaction    text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_post_reactions PRIMARY KEY (post_slug, visitor_hash),
  CONSTRAINT chk_post_reactions_slug CHECK (
    char_length(post_slug) BETWEEN 1 AND 120
    AND post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT chk_post_reactions_visitor_hash CHECK (visitor_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT chk_post_reactions_reaction CHECK (reaction IN ('like', 'dislike'))
);

CREATE TABLE IF NOT EXISTS post_engagement_events (
  post_slug    text        NOT NULL,
  visitor_hash text        NOT NULL,
  event_type   text        NOT NULL,
  event_date   date        NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_post_engagement_events PRIMARY KEY (
    post_slug,
    visitor_hash,
    event_type,
    event_date
  ),
  CONSTRAINT chk_post_engagement_events_slug CHECK (
    char_length(post_slug) BETWEEN 1 AND 120
    AND post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT chk_post_engagement_events_visitor_hash CHECK (visitor_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT chk_post_engagement_events_type CHECK (event_type IN ('view', 'share'))
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_slug_reaction
  ON post_reactions (post_slug, reaction);

CREATE INDEX IF NOT EXISTS idx_post_engagement_events_slug_type
  ON post_engagement_events (post_slug, event_type);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_engagement_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE post_reactions FROM anon, authenticated;
REVOKE ALL ON TABLE post_engagement_events FROM anon, authenticated;
