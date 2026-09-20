-- Las respuestas de la llamada, una por pregunta.
--
-- El diagnóstico se guardaba en seis campos de texto libre: seis cajas para
-- una conversación de 45 minutos con más de veinte preguntas. Lo que se
-- perdía no era el dato sino la trazabilidad — qué se preguntó, qué contestó
-- y qué quedó sin preguntar.
--
-- Ahora cada respuesta se guarda con el id de su pregunta. Los seis campos
-- siguen existiendo y se completan solos con el resumen de cada etapa: todo
-- lo que ya los lee (la propuesta, el seguimiento, la recomendación) sigue
-- funcionando sin cambios.
--
-- De acá sale también el semáforo de calificación: si nadie contestó «quién
-- decide» o «cuánto te cuesta», esa venta no está por cerrarse, y eso ahora
-- se puede ver sin leer seis párrafos.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS guia_respuestas jsonb;
