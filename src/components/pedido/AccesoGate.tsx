'use client';

import { useState } from 'react';

import type { PlanKickoff } from '@/content/kickoff';
import type { Locale } from '@/content/servicios';
import { AccesoCliente } from './AccesoCliente';
import { KickoffForm } from './KickoffForm';

/**
 * La puerta y lo que hay detrás.
 *
 * Existe porque el formulario aparece sin recargar apenas el cliente pone su
 * código: hacerlo recargar justo ahí es el momento en que más gente se cae.
 */
export function AccesoGate({
  pedidoId,
  verificado,
  plan,
  iniciales,
  yaCompletado,
  locale,
}: {
  pedidoId: string;
  verificado: boolean;
  plan: PlanKickoff;
  iniciales: Record<string, never>;
  yaCompletado: boolean;
  locale: Locale;
}) {
  const [entro, setEntro] = useState(verificado);

  if (!entro) return <AccesoCliente pedidoId={pedidoId} onEntro={() => setEntro(true)} />;

  return (
    <KickoffForm
      pedidoId={pedidoId}
      plan={plan}
      iniciales={iniciales}
      yaCompletado={yaCompletado}
      locale={locale}
    />
  );
}
