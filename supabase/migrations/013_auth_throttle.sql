-- Migration 013: Freno persistente de fuerza bruta para el login del admin
--
-- El limitador en memoria (src/lib/rate-limit.ts) guarda el contador en el
-- proceso. En Vercel cada lambda tiene el suyo, así que "5 intentos por
-- minuto" en realidad son 5 × cantidad de instancias, y reciclar una instancia
-- lo resetea. Además la clave es la IP, que el cliente controla en parte:
-- rotando IPs el límite por IP no frena nada, se guarde donde se guarde.
--
-- Este contador es global (no por IP) y vive en la base, así que sobrevive al
-- reciclado de instancias y no se puede esquivar cambiando de origen. Cuenta
-- solo fallos consecutivos y se resetea con cada login exitoso.

CREATE TABLE IF NOT EXISTS auth_throttle (
  id             text        PRIMARY KEY,
  failures       integer     NOT NULL DEFAULT 0,
  blocked_until  timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE auth_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE auth_throttle FROM anon, authenticated;
