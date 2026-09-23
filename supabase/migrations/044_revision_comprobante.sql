-- Lo que la lectura automática encontró en el comprobante.
--
-- Verificar un pago era entrar al banco, buscar el movimiento entre todos los
-- del día y cruzarlo de memoria con lo que el cliente había comprado. Eso es
-- lo que hace que un cobro tarde dos días en confirmarse, y con él la entrega.
--
-- Guarda el veredicto y los hallazgos, NO una aprobación: quien aprueba sigue
-- siendo una persona mirando. Un sistema que aprueba pagos solo es un sistema
-- que un día aprueba mal.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS comprobante_revision jsonb,
  ADD COLUMN IF NOT EXISTS comprobante_veredicto text;

COMMENT ON COLUMN pedidos.comprobante_revision IS
  'Lo transcripto del comprobante y los hallazgos de la comparación.';
COMMENT ON COLUMN pedidos.comprobante_veredicto IS
  'cuadra | revisar | no-cuadra. Es una señal para mirar, nunca una aprobación.';
