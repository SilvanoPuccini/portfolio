-- Migration 014: incremento atómico del freno de login
--
-- La versión anterior contaba en la aplicación: leía `failures`, sumaba uno y
-- escribía el resultado. Entre la lectura y la escritura hay una ventana, y
-- una fuerza bruta no manda los intentos en fila: los manda en paralelo. Cien
-- requests simultáneos leen todos el mismo valor y escriben todos el mismo
-- número, así que el contador sube 1 en vez de 100 y el freno no frena.
--
-- Acá el incremento pasa a ser un solo INSERT ... ON CONFLICT DO UPDATE, que
-- Postgres resuelve de forma atómica: cada intento suma exactamente uno,
-- lleguen en el orden que lleguen.
--
-- La curva del bloqueo se calcula del lado de la base para que dependa del
-- contador ya incrementado, no de un valor leído antes. Los parámetros los
-- pasa la aplicación (src/lib/auth-throttle.ts), que sigue siendo la única
-- fuente de los números.

CREATE OR REPLACE FUNCTION record_login_failure(
  p_id             text,
  p_free_attempts  integer,
  p_base_block_ms  bigint,
  p_max_block_ms   bigint
)
RETURNS TABLE (failures integer, blocked_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failures      integer;
  v_over          integer;
  v_block_ms      bigint;
  v_blocked_until timestamptz;
BEGIN
  INSERT INTO auth_throttle AS t (id, failures, updated_at)
  VALUES (p_id, 1, now())
  ON CONFLICT (id) DO UPDATE
    SET failures = t.failures + 1,
        updated_at = now()
  RETURNING t.failures INTO v_failures;

  v_over := v_failures - p_free_attempts;

  IF v_over <= 0 THEN
    v_blocked_until := NULL;
  ELSE
    -- El exponente se acota antes de elevar: sin esto, con muchos fallos
    -- 2^n desborda bigint y la función explota justo cuando más se la
    -- necesita. Cualquier valor alto termina en el techo igual.
    IF v_over > 40 THEN
      v_block_ms := p_max_block_ms;
    ELSE
      v_block_ms := LEAST((p_base_block_ms * (2 ^ (v_over - 1)))::bigint, p_max_block_ms);
    END IF;
    v_blocked_until := now() + make_interval(secs => v_block_ms / 1000.0);
  END IF;

  UPDATE auth_throttle SET blocked_until = v_blocked_until WHERE id = p_id;

  RETURN QUERY SELECT v_failures, v_blocked_until;
END;
$$;

-- Solo la app (service_role) puede invocarla.
REVOKE ALL ON FUNCTION record_login_failure(text, integer, bigint, bigint) FROM PUBLIC, anon, authenticated;
