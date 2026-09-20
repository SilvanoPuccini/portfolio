-- El tablero no sabía si el cliente que firmó agendó la reunión de arranque.
--
-- Cal.com maneja la venta solo hasta «en conversación»: de la propuesta en
-- adelante, toda reunión es con un cliente y el webhook la ignoraba por
-- completo para no hacer retroceder una venta firmada. El efecto secundario
-- era que un kickoff sin agendar no lo reclamaba nadie.
--
-- Ahora esa reunión se anota acá, en una columna propia: no toca el estado ni
-- `fecha_llamada`, que sigue siendo la de la llamada de venta.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS kickoff_at timestamptz;
