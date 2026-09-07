-- Migration 016: posts de LinkedIn derivados de cada artículo de El Radar
--
-- Cada semana editorial = 1 artículo de portfolio (domingo) + 2 posts de
-- LinkedIn con carrusel. La cadencia vigente es domingo / martes / viernes:
-- corrección final del 7-sep-2026 registrada en el vault
-- (`Marketing y marca/El Radar - LinkedIn.md`), que reemplaza la pauta
-- anterior de lunes/jueves. Las agendas de septiembre a noviembre todavía
-- estaban escritas con lunes/jueves; acá quedan recalculadas a martes (D+2)
-- y viernes (D+5) sobre el domingo que origina la semana.
--
-- Lo ya publicado bajo la pauta vieja no se toca: el post del 7-sep-2026
-- no entra en esta tabla.
--
-- Mismo modelo de estados que post_publications ('planificado' ->
-- 'preaprobado' -> 'publicado'), pero sin cron: LinkedIn se publica a mano
-- siguiendo la rutina de las 10:00 hora Chile. published_url guarda el
-- permalink una vez publicado, que es la evidencia de cierre que pide el
-- checklist semanal del vault.

CREATE TABLE IF NOT EXISTS linkedin_posts (
  slug            text        PRIMARY KEY,
  post_slug       text        REFERENCES post_publications (post_slug) ON DELETE SET NULL,
  slot            text        NOT NULL,
  title           text        NOT NULL,
  body            text,
  carousel_notes  text,
  carousel_pdf_url text,
  status          text        NOT NULL DEFAULT 'planificado',
  scheduled_at    timestamptz NOT NULL,
  published_at    timestamptz,
  published_url   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_linkedin_posts_slug CHECK (
    char_length(slug) BETWEEN 1 AND 120
    AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT chk_linkedin_posts_slot CHECK (slot IN ('martes', 'viernes')),
  CONSTRAINT chk_linkedin_posts_status CHECK (
    status IN ('planificado', 'preaprobado', 'publicado')
  )
);

-- Un solo post por slot y por semana editorial: evita que se dupliquen
-- derivaciones del mismo artículo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_linkedin_posts_post_slot
  ON linkedin_posts (post_slug, slot)
  WHERE post_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status_scheduled
  ON linkedin_posts (status, scheduled_at);

ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE linkedin_posts FROM anon, authenticated;

-- Seed: los 32 títulos de LinkedIn de septiembre a diciembre, con las fechas
-- ya recalculadas a la cadencia martes/viernes. Los títulos salen tal cual
-- de las agendas del vault; el cuerpo y el guion del carrusel están pendientes.

INSERT INTO linkedin_posts (slug, post_slug, slot, title, scheduled_at)
VALUES
  -- Semana 13-sep: frontend
  ('li-que-estas-eligiendo-realmente',        'nextjs-vite-o-angular',              'martes',  'Next.js, React con Vite o Angular: qué estás eligiendo realmente', '2026-09-15 13:00:00+00'),
  ('li-tres-productos-tres-decisiones',       'nextjs-vite-o-angular',              'viernes', 'Tres productos, tres decisiones de frontend',                       '2026-09-18 13:00:00+00'),

  -- Semana 20-sep: backend
  ('li-no-existe-el-mejor-backend',           'django-nodejs-o-go',                 'martes',  'No existe el mejor backend. Existe el costo que decidís asumir',    '2026-09-22 13:00:00+00'),
  ('li-mismo-producto-otro-backend',          'django-nodejs-o-go',                 'viernes', 'El mismo producto no necesita el mismo backend en todas sus etapas','2026-09-25 13:00:00+00'),

  -- Semana 27-sep: deploy
  ('li-del-commit-a-produccion',              'deploy-no-es-subir-una-carpeta',     'martes',  'Del commit a producción: qué tiene que estar resuelto',             '2026-09-29 13:00:00+00'),
  ('li-volver-a-una-version-estable',         'deploy-no-es-subir-una-carpeta',     'viernes', 'Si el deploy falla, ¿cómo volvés a una versión estable?',           '2026-10-02 13:00:00+00'),

  -- Semana 4-oct: Docker
  ('li-imagen-contenedor-y-datos',            'docker-contrato-de-ejecucion',       'martes',  'Una imagen, un contenedor y tus datos: tres cosas que conviene separar', '2026-10-06 13:00:00+00'),
  ('li-que-resuelve-docker',                  'docker-contrato-de-ejecucion',       'viernes', 'Qué resuelve Docker y qué seguís teniendo que resolver vos',        '2026-10-09 13:00:00+00'),

  -- Semana 11-oct: modelos de nube
  ('li-elegi-que-queres-administrar',         'vps-paas-baas-y-serverless',         'martes',  'Antes de elegir una nube, elegí qué querés administrar',            '2026-10-13 13:00:00+00'),
  ('li-pueden-convivir-en-el-mismo-producto', 'vps-paas-baas-y-serverless',         'viernes', 'VPS, PaaS, BaaS y serverless pueden convivir en el mismo producto', '2026-10-16 13:00:00+00'),

  -- Semana 18-oct: plataformas
  ('li-donde-va-cada-pieza',                  'vercel-render-railway-supabase',     'martes',  'Tu aplicación tiene varias piezas. ¿Dónde va cada una?',            '2026-10-20 13:00:00+00'),
  ('li-siete-cosas-antes-de-desplegar',       'vercel-render-railway-supabase',     'viernes', 'Antes de desplegar: siete cosas que revisar en una plataforma',     '2026-10-23 13:00:00+00'),

  -- Semana 25-oct: operación
  ('li-que-la-web-abra-no-alcanza',           'despues-del-deploy',                 'martes',  'Que la web abra no significa que el producto funcione',             '2026-10-27 13:00:00+00'),
  ('li-una-alerta-util-tiene-una-accion',     'despues-del-deploy',                 'viernes', 'Una alerta útil tiene una acción detrás',                           '2026-10-30 13:00:00+00'),

  -- Semana 1-nov: datos
  ('li-que-necesita-recordar-tu-producto',    'postgresql-modelo-de-datos',         'martes',  'Antes de crear tablas, definí qué necesita recordar tu producto',   '2026-11-03 13:00:00+00'),
  ('li-una-relacion-mal-modelada',            'postgresql-modelo-de-datos',         'viernes', 'Una relación mal modelada termina apareciendo en la aplicación',    '2026-11-06 13:00:00+00'),

  -- Semana 8-nov: permisos
  ('li-identidad-sesion-y-permisos',          'autenticacion-y-permisos',           'martes',  'Identidad, sesión y permisos: tres decisiones distintas',           '2026-11-10 13:00:00+00'),
  ('li-quien-puede-ver-cada-dato',            'autenticacion-y-permisos',           'viernes', '¿Quién puede ver y modificar cada dato de tu aplicación?',          '2026-11-13 13:00:00+00'),

  -- Semana 15-nov: contratos de API
  ('li-un-200-no-alcanza',                    'una-api-es-un-contrato',             'martes',  'Una respuesta 200 no alcanza para definir una buena API',           '2026-11-17 13:00:00+00'),
  ('li-cambiar-una-api-que-ya-se-usa',        'una-api-es-un-contrato',             'viernes', 'Qué pasa cuando cambiás una API que otro componente ya usa',        '2026-11-20 13:00:00+00'),

  -- Semana 22-nov: trabajo asincrónico
  ('li-tiene-que-terminar-antes-de-responder','tareas-en-segundo-plano',            'martes',  '¿Esto tiene que terminar antes de responderle al usuario?',         '2026-11-24 13:00:00+00'),
  ('li-reintentar-sin-duplicar',              'tareas-en-segundo-plano',            'viernes', 'Reintentar una tarea no debería duplicar el resultado',             '2026-11-27 13:00:00+00'),

  -- Semana 29-nov: caso integrador
  ('li-cinco-decisiones-que-encajan',         'de-una-necesidad-a-una-arquitectura','martes',  'Un producto, cinco decisiones que tienen que encajar',              '2026-12-01 13:00:00+00'),
  ('li-que-mediria-antes-de-sumar-stack',     'de-una-necesidad-a-una-arquitectura','viernes', 'Qué mediría antes de agregar otra tecnología al stack',             '2026-12-04 13:00:00+00'),

  -- Semana 6-dic: superficie expuesta
  ('li-mapa-de-las-entradas',                 'que-estas-exponiendo',               'martes',  'Un mapa de las entradas de tu aplicación',                          '2026-12-08 13:00:00+00'),
  ('li-de-lo-expuesto-a-lo-prioritario',      'que-estas-exponiendo',               'viernes', 'De lo expuesto a lo prioritario: qué revisar primero',              '2026-12-11 13:00:00+00'),

  -- Semana 13-dic: entradas
  ('li-inyeccion-sql',                        'datos-que-entran-como-ataque',       'martes',  'Inyección SQL: cómo un dato puede alterar una consulta',            '2026-12-15 13:00:00+00'),
  ('li-xss-en-el-navegador',                  'datos-que-entran-como-ataque',       'viernes', 'XSS: qué pasa cuando un dato termina ejecutándose en el navegador', '2026-12-18 13:00:00+00'),

  -- Semana 20-dic: archivos
  ('li-antes-de-aceptar-un-archivo',          'subida-de-archivos-puerta-de-entrada','martes', 'Qué revisar antes de aceptar un archivo en tu aplicación',          '2026-12-22 13:00:00+00'),
  ('li-donde-y-como-lo-guardas',              'subida-de-archivos-puerta-de-entrada','viernes','Aceptar un archivo es solo el comienzo: dónde y cómo lo guardás',   '2026-12-25 13:00:00+00'),

  -- Semana 27-dic: dependencias (el viernes cruza a 2027, se conserva)
  ('li-que-incorporas-con-una-dependencia',   'codigo-que-no-escribiste',           'martes',  'Qué estás incorporando cuando agregás una dependencia',             '2026-12-29 13:00:00+00'),
  ('li-secretos-y-configuracion',             'codigo-que-no-escribiste',           'viernes', 'Secretos y configuración: una revisión antes de cerrar el año',     '2027-01-01 13:00:00+00')
ON CONFLICT (slug) DO NOTHING;
