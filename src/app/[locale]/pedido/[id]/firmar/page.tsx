import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { FirmaContrato } from '@/components/pedido/FirmaContrato';
import { PedidoLayout } from '@/components/pedido/PedidoLayout';
import { ContractStep } from '@/components/propuesta/ContractStep';
import { clausulasDelContrato, contratoDeVenta } from '@/content/contrato';
import { cargarPedidoCompleto } from '@/lib/leads/cargar-pedido';
import { jurisdiccionCorta } from '@/lib/leads/legal-clause';
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

  const datos = await cargarPedidoCompleto(id);
  if (!datos) notFound();

  const destino = redirigirA(datos.etapa, 'firmar', currentLocale, id);
  if (destino) redirect(destino);

  const { lead, paquete, pedido, resumen } = datos;

  return (
    <PedidoLayout
      paquete={paquete}
      resumen={resumen}
      totalUsd={pedido.total_usd}
      mensualUsd={pedido.mensual_usd}
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
            nombreEsperado={lead?.nombre ?? ''}
            email={lead?.email}
            clausulas={clausulasDelContrato(contratoDeVenta({
              paquete,
              extras: resumen.extras,
              cliente: {
                nombre: lead?.nombre ?? '',
                localidad: lead?.localidad,
                pais: lead?.pais,
              },
              totalUsd: pedido.total_usd,
              jurisdiccion: jurisdiccionCorta(lead?.pais ?? null),
            }))}
          />
        )}
    </PedidoLayout>
  );
}
