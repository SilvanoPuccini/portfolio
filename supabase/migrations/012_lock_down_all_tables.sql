-- Migration 012: RLS + REVOKE en todas las tablas
--
-- Supabase le da GRANT por defecto al rol `anon` sobre el esquema public. Con
-- RLS apagada, cualquiera con la anon key y el project ref puede leer una
-- tabla entera por la API REST: leads con teléfonos y presupuestos, mensajes
-- de contacto, respuestas de cuestionarios, la lista de suscriptores.
--
-- Hoy la anon key no está en el bundle del cliente, así que no era explotable
-- desde afuera — pero el sitio queda a un solo `createClient` en un componente
-- cliente de filtrar todo. Esto cierra la puerta de entrada en vez de confiar
-- en que la llave nunca se caiga.
--
-- La app no se ve afectada: todo el acceso pasa por getSupabaseAdmin(), que
-- usa la service_role key y por definición ignora RLS.
--
-- Es idempotente a propósito: incluye también las tablas que ya estaban
-- protegidas (008, 009, 010) para que este archivo sea el piso completo.

DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    -- CRM y formularios públicos (PII)
    'leads',
    'contact_messages',
    'messages',
    'questionnaires',
    'proposals',
    'contracts',
    -- Presupuestos y tarifas
    'rate_config',
    'modulos_precio',
    'config_presupuesto',
    'modulos_presupuesto',
    -- Newsletter (PII: emails de suscriptores)
    'subscribers',
    'newsletters_sent',
    -- Distribución en redes
    'distributions',
    'distribution_logs',
    'distribution_versions',
    -- Blog (ya protegidas en 008/009/010, se repiten para dejar el piso completo)
    'post_reactions',
    'post_engagement_events',
    'post_publications',
    'editorial_guidelines'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
      RAISE NOTICE 'protegida: %', t;
    ELSE
      RAISE NOTICE 'no existe (se omite): %', t;
    END IF;
  END LOOP;
END $$;

-- Que una tabla nueva no nazca abierta por olvido.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
