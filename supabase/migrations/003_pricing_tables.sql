-- Rate configuration (single row)
create table if not exists rate_config (
  id int primary key default 1 check (id = 1),
  tarifa_hora numeric not null default 35,
  buffer_pct int not null default 20
);
insert into rate_config (id, tarifa_hora, buffer_pct) values (1, 35, 20) on conflict (id) do nothing;

-- Module pricing catalog
create table if not exists modulos_precio (
  slug text primary key,
  label text not null,
  horas_min numeric not null,
  horas_max numeric not null,
  categoria text not null
);

-- Seed modules
insert into modulos_precio (slug, label, horas_min, horas_max, categoria) values
  ('landing_base', 'Landing page', 20, 40, 'base'),
  ('web_multipagina_base', 'Web multipágina', 40, 70, 'base'),
  ('ecommerce_base', 'E-commerce', 60, 120, 'base'),
  ('saas_base', 'SaaS / Web app', 120, 200, 'base'),
  ('login', 'Login / usuarios', 15, 25, 'modulo'),
  ('pagos', 'Pagos online', 12, 20, 'modulo'),
  ('admin_panel', 'Panel de admin', 25, 40, 'modulo'),
  ('integracion_externa', 'Integración externa (c/u)', 8, 20, 'modulo'),
  ('i18n', 'Multi-idioma', 10, 15, 'modulo'),
  ('diseno_desde_cero', 'Diseño desde cero', 15, 30, 'modulo'),
  ('contenido', 'Contenido (textos/imágenes)', 5, 15, 'modulo'),
  ('automatizacion_ia', 'Automatización con IA', 20, 40, 'modulo')
on conflict (slug) do nothing;
