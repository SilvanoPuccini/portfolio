-- Migration 019: stored LinkedIn editorial library and private original PDFs.

ALTER TABLE linkedin_posts
  ADD COLUMN IF NOT EXISTS source_markdown text,
  ADD COLUMN IF NOT EXISTS source_frontmatter jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_filename text,
  ADD COLUMN IF NOT EXISTS pdf_storage_path text,
  ADD COLUMN IF NOT EXISTS pdf_original_name text,
  ADD COLUMN IF NOT EXISTS pdf_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS pdf_mime_type text,
  ADD COLUMN IF NOT EXISTS pdf_pending_path text,
  ADD COLUMN IF NOT EXISTS pdf_pending_at timestamptz,
  ADD COLUMN IF NOT EXISTS pre_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE linkedin_posts
  ADD CONSTRAINT chk_linkedin_posts_pdf_size
    CHECK (pdf_size_bytes IS NULL OR pdf_size_bytes BETWEEN 1 AND 26214400),
  ADD CONSTRAINT chk_linkedin_posts_published_url
    CHECK (published_url IS NULL OR published_url ~ '^https://') NOT VALID;

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_active_scheduled
  ON linkedin_posts (scheduled_at)
  WHERE deleted_at IS NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('linkedin-originals', 'linkedin-originals', false, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Application access is exclusively through authenticated admin Route Handlers
-- and short-lived signed URLs. No anon/authenticated object policies are added.
