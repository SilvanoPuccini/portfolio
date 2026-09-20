-- «Dejámelo pensar»: la tercera respuesta.
--
-- La propuesta tenía dos salidas, sí y no, y la realidad tiene tres. El
-- cliente que necesita consultarlo con el socio, esperar la cobranza del mes o
-- simplemente pensarlo no tiene botón: cierra la pestaña. Desde el panel eso
-- se ve igual que el desinterés —silencio— y es justo el caso que más se
-- pierde por no hacer seguimiento a tiempo.
--
-- Ahora elige cuándo quiere que le vuelvan a escribir y eso queda agendado. El
-- silencio se convierte en una fecha, que es la diferencia entre perseguir a
-- alguien y respetarle el tiempo.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS propuesta_recordar_at timestamptz;
