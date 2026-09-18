-- Migration 024: cerrar el circuito de venta hasta la entrega.
--
-- El recorrido terminaba en "cerrado", que es justo donde empieza el trabajo
-- real: firmar, cobrar, facturar y entregar vivían fuera del panel. Estas
-- columnas son las marcas de cada uno de esos hechos.
--
-- Ninguna es obligatoria y ninguna toca datos existentes: un lead viejo sigue
-- siendo válido con todas en null. El estado se guarda en `estado`, que ya
-- existe; esto guarda el DETALLE de cada paso, no el paso.

ALTER TABLE leads
  -- Firma del contrato. Hoy se marca a mano; cuando Documenso esté conectado,
  -- su webhook llena esta fecha y el paso deja de necesitar a nadie.
  ADD COLUMN IF NOT EXISTS contrato_firmado_at  timestamptz,

  -- Cobro. `sena_pct` es el porcentaje acordado (el panel sugiere 50 % y baja
  -- a 30 % o 25 % en proyectos grandes, pero el número final lo elige una
  -- persona). `pago_unico` distingue la seña del pago completo por adelantado,
  -- que solo es razonable en trabajos chicos.
  ADD COLUMN IF NOT EXISTS sena_pct             numeric,
  ADD COLUMN IF NOT EXISTS sena_monto           numeric,
  ADD COLUMN IF NOT EXISTS pago_unico           boolean,
  ADD COLUMN IF NOT EXISTS cobrado_at           timestamptz,

  -- Facturación. Hoy Silvano todavía no factura: el panel guarda el número y
  -- la fecha de lo que se emite afuera. Emitir desde acá (ARCA en Argentina,
  -- SII en Chile) es una decisión posterior y con sus propias dependencias.
  ADD COLUMN IF NOT EXISTS factura_numero       text,
  ADD COLUMN IF NOT EXISTS factura_at           timestamptz,

  -- Entrega: el final del recorrido.
  ADD COLUMN IF NOT EXISTS entregado_at         timestamptz,

  -- Por qué se perdió. Sin el motivo, "descartado" es un agujero: no se puede
  -- aprender de lo que no se sabe por qué falló.
  ADD COLUMN IF NOT EXISTS perdido_motivo       text,
  ADD COLUMN IF NOT EXISTS perdido_at           timestamptz;

-- Los dos tableros que más se consultan filtran por estado: la lista de ventas
-- en juego y el aviso de propuestas que se enfrían.
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads (estado);
