-- El contrato se crea al aceptar, no después.
--
-- El circuito era: el cliente acepta → sale un correo con el contrato
-- adjunto → Silvano lo sube a Documenso a mano → manda la firma. Tres pasos
-- manuales entre el «sí» y la firma, y ahí es donde una venta se enfría: el
-- entusiasmo del momento en que alguien dice que sí no dura dos días.
--
-- Ahora el contrato se crea en Documenso apenas acepta, con el precio y el
-- alcance ya cargados, y el link de firma queda guardado para mostrarlo en la
-- misma página. Se guarda el token además del link porque la firma embebida
-- lo necesita: el link sirve para abrir en otra pestaña, el token para firmar
-- sin salir del sitio.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS contrato_signing_url text,
  ADD COLUMN IF NOT EXISTS contrato_firma_token text,
  ADD COLUMN IF NOT EXISTS contrato_envelope_id text;
