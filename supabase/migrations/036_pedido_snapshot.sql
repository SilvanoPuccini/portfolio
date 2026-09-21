-- Lo que el cliente eligió del catálogo, con el precio del día que lo eligió.
--
-- Hasta ahora el presupuesto se armaba entero módulo por módulo, incluso
-- cuando el cliente ya había elegido un paquete de precio cerrado. Eso obliga
-- a reconstruir a mano algo que el cliente ya había decidido, y abre la puerta
-- a que el número del panel no sea el mismo que vio en la página.
--
-- Acá queda el pedido: el paquete, los extras tildados y los dos totales, el
-- del proyecto y el mensual. Se congela por la misma razón que
-- `propuesta_snapshot`: si mañana cambia la lista de precios, lo que se cerró
-- ayer no se mueve.
--
-- Vale aunque el cliente nunca firme. Saber que veinte personas tildaron
-- «agenda de turnos» y ninguna terminó de comprar es información de negocio
-- que hoy se pierde sin dejar rastro.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pedido_snapshot jsonb;
