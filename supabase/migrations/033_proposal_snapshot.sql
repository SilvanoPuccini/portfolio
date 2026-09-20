-- El diagnóstico que ve el cliente, congelado al mandarlo.
--
-- La propuesta viajaba como un .docx adjunto y un correo que decía «mirá el
-- adjunto». Ahora el cliente recibe un link a una página que se lee en el
-- teléfono y no se rompe en ningún cliente de correo.
--
-- Se guarda una FOTO del documento, no se arma en vivo. Si después se toca el
-- presupuesto en el panel —y se toca, porque las propuestas se negocian—, lo
-- que el cliente ya recibió no puede cambiar bajo sus pies: un precio que se
-- mueve solo entre que lo leyó y lo aceptó no es una propuesta, es un
-- problema.
--
-- El mantenimiento mensual va aparte porque es una decisión comercial por
-- cliente, no un módulo del presupuesto: se cobra todos los meses y no entra
-- en las horas del proyecto.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS mantenimiento_mensual numeric,
  ADD COLUMN IF NOT EXISTS propuesta_snapshot    jsonb;
