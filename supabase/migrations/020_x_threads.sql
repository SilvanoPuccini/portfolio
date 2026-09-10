-- Migration 020: hilos de X derivados del post del blog.
--
-- Un post del blog del domingo da un guion de hasta cuatro ángulos, y cada
-- ángulo se convierte en un hilo que sale lunes, miércoles, jueves o sábado.
-- El texto se genera y se valida días antes de publicarse.

CREATE TABLE IF NOT EXISTS x_threads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- De qué post del blog sale. La fuente es siempre el artículo, nunca la
  -- pieza de LinkedIn: derivar de un derivado pierde información dos veces.
  post_slug       text        NOT NULL REFERENCES post_publications (post_slug) ON DELETE CASCADE,

  -- El guion de la semana vive en el ángulo: idea central y qué resuelve.
  angle_id        text        NOT NULL,
  angle_summary   text        NOT NULL,
  thesis          text,

  -- Los tweets en orden. Cada uno { text }. El link nunca va acá.
  tweets          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  reply_with_link text,

  -- Respaldo de cada afirmación contra la fuente, para poder auditar después
  -- por qué el sistema dijo lo que dijo.
  evidence        jsonb       NOT NULL DEFAULT '[]'::jsonb,

  status          text        NOT NULL DEFAULT 'planificado',
  scheduled_at    timestamptz NOT NULL,
  pre_approved_at timestamptz,
  published_at    timestamptz,

  -- IDs de X en el orden en que salieron. Si el hilo se corta a la mitad,
  -- esto es lo que permite retomar desde el cuarto en vez de republicar todo.
  published_ids   text[]      NOT NULL DEFAULT '{}',
  published_url   text,

  -- Huella del paquete aprobado. Publicar exige que el texto sea exactamente
  -- el que pasó los controles: cualquier edición posterior obliga a repetirlos.
  approved_fingerprint text,

  generation_attempts int     NOT NULL DEFAULT 0,
  publish_attempts    int     NOT NULL DEFAULT 0,
  last_error      text,

  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_x_threads_status CHECK (
    status IN ('planificado', 'preaprobado', 'publicado', 'error')
  ),
  -- Un ángulo por post sale una sola vez. Es lo que impide que una
  -- reejecución del mismo turno publique el hilo dos veces.
  CONSTRAINT uq_x_threads_angle UNIQUE (post_slug, angle_id)
);

CREATE INDEX IF NOT EXISTS idx_x_threads_due
  ON x_threads (scheduled_at)
  WHERE deleted_at IS NULL AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_x_threads_post
  ON x_threads (post_slug)
  WHERE deleted_at IS NULL;

-- Igual que el resto de las tablas del admin: sin políticas para anon ni
-- authenticated. El acceso es exclusivamente por Route Handlers autenticados.
ALTER TABLE x_threads ENABLE ROW LEVEL SECURITY;
