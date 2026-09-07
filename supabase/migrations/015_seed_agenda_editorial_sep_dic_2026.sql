-- Migration 015: seed de la agenda editorial de El Radar (13-sep a 27-dic 2026)
--
-- Fuente de verdad: vault de Obsidian, `Marketing y marca/`:
--   - El Radar - Calendario editorial.md
--   - El Radar - Agenda Sep-Nov 2026/{00-Agenda-Septiembre,00-Agenda-Octubre,00-Propuestas-Noviembre}
--   - El Radar - Agenda Dic 2026-Ene 2027.md
--
-- Carga los 16 domingos en estado 'planificado'. Planificado es a propósito:
-- el cron de publicacion solo saca lo que esta 'preaprobado', asi que esto
-- llena el calendario del admin sin poner nada en riesgo de salir solo.
--
-- scheduled_at 13:00 UTC = 10:00 Argentina, la misma ventana que usa
-- /api/cron/publish-scheduled-posts (vercel.json: "0 13 * * *").
--
-- Idempotente: ON CONFLICT DO NOTHING. Si un slug ya existe (el del 6-sep,
-- por ejemplo), esta migracion no lo pisa ni le cambia el estado.

INSERT INTO post_publications (post_slug, raw_title, scheduled_at, status, notify_subscribers)
VALUES
  -- Septiembre: cierre del hilo stack -> frontend -> backend -> deploy
  ('nextjs-vite-o-angular',
   'Next.js, React con Vite o Angular: la herramienta correcta depende del problema',
   '2026-09-13 13:00:00+00', 'planificado', true),
  ('django-nodejs-o-go',
   'Django, Node.js o Go: elegir backend es elegir dónde pagar la complejidad',
   '2026-09-20 13:00:00+00', 'planificado', true),
  ('deploy-no-es-subir-una-carpeta',
   'Deploy no es subir una carpeta',
   '2026-09-27 13:00:00+00', 'planificado', true),

  -- Octubre: contenedores, modelos de infraestructura y operación
  ('docker-contrato-de-ejecucion',
   'Docker: qué significa poder ejecutar el mismo proyecto en otro entorno',
   '2026-10-04 13:00:00+00', 'planificado', true),
  ('vps-paas-baas-y-serverless',
   'VPS, PaaS, BaaS y serverless: qué administrás vos y qué delegás',
   '2026-10-11 13:00:00+00', 'planificado', true),
  ('vercel-render-railway-supabase',
   'Vercel, Render, Railway y Supabase: qué parte de tu arquitectura resuelve cada una',
   '2026-10-18 13:00:00+00', 'planificado', true),
  ('despues-del-deploy',
   'Después del deploy: cómo saber si tu producto sigue funcionando',
   '2026-10-25 13:00:00+00', 'planificado', true),

  -- Noviembre: datos, permisos, contratos de API y trabajo asincrónico
  ('postgresql-modelo-de-datos',
   'PostgreSQL: el modelo de datos también es una decisión de producto',
   '2026-11-01 13:00:00+00', 'planificado', true),
  ('autenticacion-y-permisos',
   'Autenticación y permisos: entrar al sistema no significa poder hacer todo',
   '2026-11-08 13:00:00+00', 'planificado', true),
  ('una-api-es-un-contrato',
   'Una API es un contrato entre partes de tu producto',
   '2026-11-15 13:00:00+00', 'planificado', true),
  ('tareas-en-segundo-plano',
   'Tareas en segundo plano: qué trabajo puede esperar y cuál no',
   '2026-11-22 13:00:00+00', 'planificado', true),
  ('de-una-necesidad-a-una-arquitectura',
   'De una necesidad a una arquitectura: diseñar un producto de punta a punta',
   '2026-11-29 13:00:00+00', 'planificado', true),

  -- Diciembre: seguridad del software
  ('que-estas-exponiendo',
   'Tu aplicación ya está en internet: ¿qué estás exponiendo?',
   '2026-12-06 13:00:00+00', 'planificado', true),
  ('datos-que-entran-como-ataque',
   'Los datos que entran también pueden convertirse en un ataque',
   '2026-12-13 13:00:00+00', 'planificado', true),
  ('subida-de-archivos-puerta-de-entrada',
   'Una subida de archivos también es una puerta de entrada',
   '2026-12-20 13:00:00+00', 'planificado', true),
  ('codigo-que-no-escribiste',
   'La seguridad también depende del código que no escribiste',
   '2026-12-27 13:00:00+00', 'planificado', true)
ON CONFLICT (post_slug) DO NOTHING;
