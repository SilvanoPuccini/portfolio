\set ON_ERROR_STOP on

-- This harness must run only in a newly-created disposable database.
DROP TABLE IF EXISTS public.pedidos CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Minimal schema-compatible subset of migration 038 required by migration 052
-- and the focused immutability fixture.
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paquete text NOT NULL,
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_usd numeric NOT NULL DEFAULT 0,
  mensual_usd numeric NOT NULL DEFAULT 0,
  locale text NOT NULL DEFAULT 'es',
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  firmado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_lead_id ON public.pedidos (lead_id);
CREATE INDEX idx_pedidos_created_at ON public.pedidos (created_at DESC);

\ir ../migrations/052_order_configuration_snapshot.sql
\ir 052_order_configuration_snapshot.sql

DROP TABLE public.pedidos CASCADE;
DROP TABLE public.leads CASCADE;
