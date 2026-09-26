-- Run only in a disposable PostgreSQL database, never against application data.
\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE public.leads (id uuid PRIMARY KEY, estado text, contrato_firmado_at timestamptz);
CREATE TABLE public.pedidos (id uuid PRIMARY KEY, lead_id uuid REFERENCES leads, firmado_at timestamptz);
CREATE TABLE public.firmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id uuid NOT NULL REFERENCES leads,
  pedido_id uuid REFERENCES pedidos, nombre text NOT NULL, ip text, navegador text,
  texto text NOT NULL, huella text NOT NULL, pdf_path text, firmado_at timestamptz NOT NULL
);
\ir ../migrations/046_atomic_order_signature.sql
INSERT INTO leads VALUES ('00000000-0000-0000-0000-000000000001', 'contrato_enviado', NULL);
INSERT INTO pedidos VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', NULL);

-- Simulate the formerly ignored final write failing: every earlier write must roll back.
CREATE FUNCTION reject_order_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'simulated order write failure'; END $$;
CREATE TRIGGER reject_order BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION reject_order_update();
DO $$
DECLARE result jsonb;
BEGIN
  BEGIN
    result := public.persist_order_signature('00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000001', 'contrato_enviado', 'contrato_firmado',
      '{"nombre":"Test","texto":"original","huella":"hash","pdf_path":"original.pdf","firmado_at":"2026-09-25T10:00:00Z"}');
    RAISE EXCEPTION 'Expected update failure';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'simulated order write failure' THEN RAISE; END IF;
  END;
  ASSERT NOT EXISTS (SELECT 1 FROM firmas), 'evidence survived rollback';
  ASSERT (SELECT contrato_firmado_at IS NULL AND estado = 'contrato_enviado' FROM leads), 'lead survived rollback';
END $$;
DROP TRIGGER reject_order ON pedidos;

DO $$
DECLARE result jsonb;
BEGIN
  result := public.persist_order_signature('00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001', 'contrato_enviado', 'contrato_firmado',
    '{"nombre":"Test","texto":"original","huella":"hash","pdf_path":"original.pdf","firmado_at":"2026-09-25T10:00:00Z"}');
  ASSERT (result->>'created')::boolean, 'retry did not create signature';
  ASSERT (SELECT estado = 'contrato_firmado' AND contrato_firmado_at = '2026-09-25T10:00:00Z' FROM leads);
  ASSERT (SELECT firmado_at = '2026-09-25T10:00:00Z' FROM pedidos);

  -- Competing/late signatures cannot replace the first accepted evidence.
  result := public.persist_order_signature('00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001', 'contrato_enviado', 'contrato_firmado',
    '{"nombre":"Changed","texto":"changed","huella":"new","firmado_at":"2026-09-26T10:00:00Z"}');
  ASSERT NOT (result->>'created')::boolean;
  ASSERT (SELECT count(*) = 1 FROM firmas);
  ASSERT (SELECT texto = 'original' AND pdf_path = 'original.pdf' FROM firmas);

  -- Repair legacy partial state and preserve a more advanced pipeline state.
  UPDATE pedidos SET firmado_at = NULL;
  UPDATE leads SET estado = 'entregado';
  result := public.persist_order_signature('00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001', 'contrato_enviado', 'contrato_firmado', NULL);
  ASSERT NOT (result->>'created')::boolean;
  ASSERT (SELECT firmado_at = '2026-09-25T10:00:00Z' FROM pedidos);
  ASSERT (SELECT estado = 'entregado' FROM leads);
  ASSERT NOT has_function_privilege('anon', 'public.persist_order_signature(uuid,uuid,text,text,jsonb)', 'EXECUTE');
  ASSERT NOT has_function_privilege('authenticated', 'public.persist_order_signature(uuid,uuid,text,text,jsonb)', 'EXECUTE');
  ASSERT has_function_privilege('service_role', 'public.persist_order_signature(uuid,uuid,text,text,jsonb)', 'EXECUTE');
END $$;
SELECT 'signature persistence assertions passed' AS result;
