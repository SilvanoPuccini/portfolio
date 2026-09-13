-- Migration 021: el circuito de X pasa a manual.
--
-- Hilo X pasa a ser la base única: cada tweet lleva su número explícito, el
-- histórico de reescrituras queda persistido (para que el generador no arranque
-- de cero en cada intento) y regenerar un ángulo borrado deja de chocar con la
-- fila vieja.

-- 1. Cada tweet, dentro de `tweets`, pasa a llevar su número. El orden deja de
--    ser "el índice del array" y pasa a ser un dato explícito que sobrevive a
--    cualquier reescritura del registro.
--
-- 2. `rewrite_history` guarda las vueltas de generación: los fixes de cada
--    intento, el número de intento y qué proveedor corrió. La generación se
--    alimenta de esto para no repetir errores; el tope de entradas lo aplica
--    el código, no la base.
--
-- 3. `plan` guarda el guion de la semana tal como se planificó, para que
--    re-generar un hilo NO vuelva a pedirle el guion a la IA. Re-planear es una
--    acción explícita de la persona, no una consecuencia de regenerar.
--
-- 4. Se suelta la unicidad (post_slug, angle_id). Borrar un hilo planificado y
--    regenerar ESE ángulo tiene que ser posible; la restricción solo lo
--    impedía, y para los publicados la protección de no republicar sigue
--    viviendo en published_at, no en la unicidad.

ALTER TABLE x_threads
  ADD COLUMN IF NOT EXISTS rewrite_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS plan jsonb;

-- Backfill de tweet_number por el índice del array (orden histórico) y del
-- plan desde el ángulo único que existía antes.
DO $$
DECLARE
  row_record   RECORD;
  tweet_index  integer;
  tweet_row    jsonb;
  numbered     jsonb;
  angle_summary_part text;
  angle_question_part text;
BEGIN
  FOR row_record IN
    SELECT id, tweets, angle_id, angle_summary, plan FROM x_threads
    WHERE deleted_at IS NULL
  LOOP
    numbered := '[]'::jsonb;
    FOR tweet_index IN 0 .. jsonb_array_length(row_record.tweets) - 1 LOOP
      tweet_row := row_record.tweets->tweet_index;
      -- Si ya tiene número (reejecución), no lo piso.
      IF tweet_row->'tweet_number' IS NULL THEN
        tweet_row := tweet_row || jsonb_build_object('tweet_number', tweet_index + 1);
      END IF;
      numbered := numbered || tweet_row;
    END LOOP;
    IF jsonb_array_length(row_record.tweets) <> 0 THEN
      UPDATE x_threads SET tweets = numbered WHERE id = row_record.id;
    END IF;

    -- El `plan` de las filas viejas es su propio ángulo, reconstruido desde
    -- angle_summary ("summary | question").
    IF row_record.plan IS NULL THEN
      angle_summary_part := split_part(row_record.angle_summary, ' | ', 1);
      angle_question_part := split_part(row_record.angle_summary, ' | ', 2);
      UPDATE x_threads SET plan = jsonb_build_array(jsonb_build_object(
        'id', row_record.angle_id,
        'summary', angle_summary_part,
        'question', angle_question_part
      )) WHERE id = row_record.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE x_threads
  DROP CONSTRAINT IF EXISTS uq_x_threads_angle;