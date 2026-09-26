'use client';

import { useRouter } from 'next/navigation';

import type { PlanKickoff } from '@/content/kickoff';
import type { Locale } from '@/content/servicios';
import { AccesoCliente } from './AccesoCliente';
import { KickoffForm } from './KickoffForm';

type AccessProps = {
  pedidoId: string;
  locale: Locale;
} & (
  | { verificado: false }
  | {
      verificado: true;
      plan: PlanKickoff;
      iniciales: Record<string, never>;
      yaCompletado: boolean;
    }
);

/** Only a fresh server response can authorize and supply private materials. */
export function AccesoGate(props: AccessProps) {
  const router = useRouter();

  if (!props.verificado) {
    return <AccesoCliente pedidoId={props.pedidoId} onEntro={() => router.refresh()} />;
  }

  const { pedidoId, plan, iniciales, yaCompletado, locale } = props;

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
