-- Los días de espera por la agenda, congelados al crear el pedido.
--
-- Los plazos del catálogo valen para un proyecto a la vez. Cuando la demanda
-- se junta, el que llega último arranca más tarde, y eso tiene que estar en
-- el plazo que firma. Se guarda al crear el pedido y no se recalcula: si
-- cambiara entre que el cliente lee el contrato y lo firma, firmaría otro
-- plazo del que leyó.
--
-- El código tolera que la columna no exista: sin esta migración, la espera
-- es 0 y todo funciona como antes.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS espera_dias integer NOT NULL DEFAULT 0
  CHECK (espera_dias >= 0);

COMMENT ON COLUMN pedidos.espera_dias IS
  'Días hábiles que se suman al plazo por el trabajo en curso al momento de pedir.';
