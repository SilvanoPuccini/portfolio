-- La recomendación de qué ofrecerle al cliente, después de la llamada.
--
-- Se guarda por dos motivos. Uno práctico: cada una cuesta cuota de IA y se
-- mira varias veces mientras se arma la propuesta. Otro de fondo: al escribir
-- la propuesta conviene poder comparar lo que se está ofreciendo con lo que
-- la recomendación decía, sobre todo cuando decía «no ofrecer esto».

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS recomendacion jsonb;
