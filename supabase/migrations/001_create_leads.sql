create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nombre text not null,
  email text not null,
  telefono text,
  tipo_proyecto text,
  que_construir text,
  secciones text,
  tiene_login boolean,
  tiene_pagos boolean,
  tiene_admin text,
  integraciones text[],
  idiomas int default 1,
  tiene_marca boolean,
  tiene_contenido boolean,
  problema text,
  presupuesto_rango text,
  plazo text,
  canal_llamada text,
  estado text default 'nuevo',
  titular text,
  localidad text,
  pais text,
  notas_llamada text,
  monto_presupuestado numeric,
  horas_calculadas numeric
);

create index idx_leads_estado on leads(estado);
create index idx_leads_created_at on leads(created_at desc);
