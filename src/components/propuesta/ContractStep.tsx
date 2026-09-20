'use client';

import { useState } from 'react';
import { EmbedSignDocument } from '@documenso/embed-react';

/**
 * La firma, sin salir de la propuesta.
 *
 * El cliente acepta y el contrato ya existe: no hay correo que esperar ni
 * pestaña que buscar. Ese hueco —entre el «sí» y la firma— es donde una venta
 * se enfría, y acá dura lo que tarda en scrollear.
 *
 * El link a Documenso queda igual, visible. Embeber no puede ser una jaula:
 * si el iframe no carga (bloqueadores, un navegador viejo, la red del cliente)
 * tiene que haber una salida obvia, y el contrato es demasiado importante para
 * depender de que un iframe funcione.
 */
export function ContractStep({ token, signingUrl }: { token: string | null; signingUrl: string | null }) {
  const [signed, setSigned] = useState(false);

  if (signed) {
    return (
      <div className="surface-panel border border-brand-primary/30 px-7 py-10 text-center">
        <p className="section-title-sm">Contrato firmado</p>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-text-secondary">
          Te llega una copia por mail, con el comprobante de firma. En unos minutos vas a recibir los datos para
          pagar la seña y arrancamos.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel relative overflow-hidden border border-brand-primary/25 px-4 py-8 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--brand-primary)/0.6),transparent)]"
      />

      <h2 className="section-title-sm px-2">Firmá el contrato</h2>
      <p className="mt-3 max-w-xl px-2 text-base leading-7 text-text-secondary">
        Es el mismo alcance y el mismo precio que acabás de leer. Leelo con calma: firmar no dispara ningún cobro,
        los datos de pago te llegan después.
      </p>

      {token ? (
        <div className="mt-7 overflow-hidden rounded-[var(--radius-soft)] border border-outline-ghost/10">
          <EmbedSignDocument
            token={token}
            className="h-[70vh] min-h-[540px] w-full"
            onDocumentCompleted={() => setSigned(true)}
          />
        </div>
      ) : (
        <p className="mt-7 px-2 text-base leading-7 text-text-secondary">
          En unos minutos te llega el contrato por mail para firmarlo.
        </p>
      )}

      {signingUrl && (
        <p className="mt-5 px-2 text-sm text-text-tertiary">
          ¿No lo ves bien acá?{' '}
          <a href={signingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
            Abrilo en una pestaña nueva ↗
          </a>
        </p>
      )}
    </div>
  );
}
