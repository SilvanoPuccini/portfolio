-- Disposable database fixture only; never run against application data.
\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text NOT NULL, email text NOT NULL, pais text,
 estado text, contrato_firmado_at timestamptz, tipo_proyecto text, que_construir text,
 monto_presupuestado numeric, mantenimiento_mensual numeric, pago_unico boolean, service text,
 modulos_seleccionados jsonb, pedido_snapshot jsonb, contract_sent_at timestamptz,
 contrato_signing_url text, contrato_firma_token text, contrato_envelope_id text
);
CREATE TABLE pedidos (
 id uuid PRIMARY KEY, lead_id uuid REFERENCES leads, firmado_at timestamptz,
 paquete text DEFAULT 'landing', extras jsonb DEFAULT '[]', total_usd numeric DEFAULT 450, mensual_usd numeric DEFAULT 0
);
\ir ../migrations/047_atomic_contract_preparation.sql
INSERT INTO pedidos (id) VALUES ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002'), ('00000000-0000-0000-0000-000000000003');
CREATE FUNCTION reject_association() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'simulated association failure'; END $$;
CREATE TRIGGER reject_association BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION reject_association();
DO $$
BEGIN
 BEGIN
  PERFORM prepare_order_contract('00000000-0000-0000-0000-000000000001', '{"nombre":"Test","email":"test@example.test"}', false);
  RAISE EXCEPTION 'expected failure';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'simulated association failure' THEN RAISE; END IF;
 END;
 ASSERT NOT EXISTS (SELECT 1 FROM leads), 'orphan buyer survived rollback';
 ASSERT NOT EXISTS (SELECT 1 FROM pedidos WHERE lead_id IS NOT NULL);
END $$;
DROP TRIGGER reject_association ON pedidos;
DO $$
DECLARE first jsonb; again jsonb;
BEGIN
 first := prepare_order_contract('00000000-0000-0000-0000-000000000001', '{"nombre":"Test Person","email":"test@example.test","pais":"Argentina"}', true);
 again := prepare_order_contract('00000000-0000-0000-0000-000000000001', '{"nombre":"  TEST   Person  ","email":" TEST@EXAMPLE.TEST ","pais":" argentina "}', true);
 ASSERT first->>'id' = again->>'id';
 ASSERT (first->>'created')::boolean AND NOT (again->>'created')::boolean;
 ASSERT (first->>'provision')::boolean AND NOT (again->>'provision')::boolean;
 ASSERT (SELECT count(*) = 1 FROM leads);
 ASSERT (SELECT monto_presupuestado = 450 FROM leads);
 BEGIN
  PERFORM prepare_order_contract('00000000-0000-0000-0000-000000000001', '{"nombre":"Other","email":"other@example.test"}', false);
  RAISE EXCEPTION 'expected buyer conflict';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'buyer_conflict' THEN RAISE; END IF;
 END;
 ASSERT NOT has_function_privilege('anon', 'prepare_order_contract(uuid,jsonb,boolean)', 'EXECUTE');
 ASSERT NOT has_function_privilege('authenticated', 'prepare_order_contract(uuid,jsonb,boolean)', 'EXECUTE');
 ASSERT has_function_privilege('service_role', 'prepare_order_contract(uuid,jsonb,boolean)', 'EXECUTE');
END $$;
SELECT 'contract preparation assertions passed';
