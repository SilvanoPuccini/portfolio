-- Qué módulos se le cotizaron a este lead.
--
-- La calculadora guardaba solo el total de horas y el precio: qué módulos
-- entraban en ese número no quedaba en ningún lado. La propuesta intentaba
-- reconstruirlo listando el catálogo entero —todos los módulos, para todos
-- los clientes— y encima lo pedía a una tabla que no existe, así que el PDF
-- salía con la lista vacía.
--
-- Ahora el alcance se guarda con el presupuesto: los módulos elegidos, con su
-- nombre y sus horas, tal como estaban el día que se cotizó. Se guarda el
-- nombre y no solo el slug a propósito: si mañana cambia el catálogo, la
-- propuesta que ya se mandó tiene que seguir diciendo lo mismo que firmó el
-- cliente.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS modulos_seleccionados jsonb;
