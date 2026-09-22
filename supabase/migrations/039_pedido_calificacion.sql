-- Lo que el cliente contestó antes de comprar.
--
-- Cada paquete se protege con una o dos preguntas: cuántas secciones, cuántos
-- productos, de dónde salen los datos. Hasta ahora esas respuestas solo
-- encendían el botón de contratar y después se perdían.
--
-- Es la información más barata de conseguir y la más cara de volver a pedir:
-- el cliente ya la contestó una vez. Guardándola, el formulario de arranque
-- deja de preguntar lo mismo de otra forma y el panel sabe qué compró cada uno
-- sin tener que adivinar.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS calificacion jsonb NOT NULL DEFAULT '{}'::jsonb;
