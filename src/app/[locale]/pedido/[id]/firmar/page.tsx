import { cookies } from 'next/headers';
import { COOKIE_VERIFICADO, tieneVerificacion } from '@/lib/leads/acceso-cliente';
import { VerifyOrderAccess } from '@/components/pedido/VerifyOrderAccess';
import { createRevision, readRevision } from '@/lib/leads/contract-revision';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { FirmaContrato } from '@/components/pedido/FirmaContrato';
import { PedidoLayout } from '@/components/pedido/PedidoLayout';
import { ContractStep } from '@/components/propuesta/ContractStep';
import { contratoDeVenta } from '@/content/contrato';
import { cargarPedidoCompleto } from '@/lib/leads/cargar-pedido';
import { parseConfigurationSnapshot } from '@/lib/order-configuration-snapshot';
import { revisionFromConfiguration } from '@/lib/leads/contract-from-configuration';
import { legalClauseFor } from '@/lib/leads/legal-clause';
import { redirigirA } from '@/lib/leads/pedido-pasos';
import { resolveLocale } from '@/lib/i18n';
import type { Locale } from '@/content/servicios';

/**
 * Paso 2: el contrato.
 *
 * Tiene dirección propia para que «atrás» devuelva a sus datos y no saque del
 * pedido entero, y para que el link se pueda guardar y volver directo acá.
 *
 * El que ya firmó no vuelve a ver esta pantalla: `redirigirA` lo manda al
 * pago. Mostrarle otra vez el contrato de algo firmado es la forma más rápida
 * de hacerle creer que no se guardó.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; id: string }>;

export const metadata: Metadata = {
  title: 'Firmá tu contrato | Silvano Puccini',
  robots: { index: false, follow: false },
};

const titulo = { es: 'El contrato', en: 'The contract' } as const;

export default async function FirmarPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  const currentLocale = resolveLocale(locale) as Locale;

  if (!tieneVerificacion((await cookies()).get(COOKIE_VERIFICADO)?.value, id)) {
    return <main className="site-container py-14"><VerifyOrderAccess pedidoId={id} /></main>;
  }
  const datos = await cargarPedidoCompleto(id);
  if (!datos) notFound();

  const destino = redirigirA(datos.etapa, 'firmar', currentLocale, id);
  if (destino) redirect(destino);

  const { lead, paquete, pedido, resumen, espera } = datos;

  if (pedido.total_usd <= 0) {
    return <main className="site-container py-14"><p>{currentLocale === 'es'
      ? 'La activación y el primer cobro de este plan deben confirmarse antes de firmar. No realices una transferencia de importe cero.'
      : 'Activation and the first payment must be confirmed before signing. Do not make a zero-value transfer.'}</p></main>;
  }
  if (!lead || !pedido.lead_id) notFound();
  // Previously frozen contract terms remain authoritative over catalog data.
  let snapshot = pedido.contrato_snapshot == null ? null : readRevision(pedido.contrato_snapshot);
  if (!lead.contrato_firma_token && !snapshot) {
    const archived = pedido.configuracion_snapshot == null
      ? null
      : parseConfigurationSnapshot(pedido.configuracion_snapshot);
    if (pedido.configuracion_snapshot != null && !archived) {
      throw new Error('The frozen order configuration is unavailable.');
    }
    const candidate = archived
      ? revisionFromConfiguration(archived, lead, legalClauseFor(lead.pais), espera)
      : createRevision(contratoDeVenta({ paquete, extras: resumen.extras,
        cliente: lead, totalUsd: pedido.total_usd, jurisdiccion: legalClauseFor(lead.pais), diasDeEspera: espera }));
    const { data: stored, error } = await getSupabaseAdmin().rpc('freeze_order_contract', {
      p_order_id: id, p_lead_id: pedido.lead_id, p_snapshot: candidate,
    });
    if (error) throw new Error('Could not load the contract revision');
    snapshot = stored ? readRevision(stored) : null;
  }

  return (
    <PedidoLayout
      paquete={paquete}
      resumen={resumen}
      totalUsd={pedido.total_usd}
      mensualUsd={pedido.mensual_usd}
      esperaDias={espera}
      locale={currentLocale}
      paso="firmar"
      titulo={titulo[currentLocale]}
    >
      {/* Los contratos viejos se firmaron en Documenso y su token sigue
          valiendo: se respeta dónde nació cada uno. */}
      {lead?.contrato_firma_token
        ? <ContractStep token={lead.contrato_firma_token} signingUrl={lead.contrato_signing_url} />
        : (
          <FirmaContrato
            pedidoId={pedido.id}
            nombreEsperado={snapshot!.datos.clientName}
            email={lead?.email}
            revision={snapshot!.revision}
            clausulas={snapshot!.clausulas}
          />
        )}
    </PedidoLayout>
  );
}
