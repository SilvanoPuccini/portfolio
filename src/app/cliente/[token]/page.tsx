import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import Reveal from '@/components/site/Reveal';
import { etapaDelCliente } from '@/lib/leads/client-stage';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El único link que el cliente necesita guardar.
 *
 * Siempre es la misma dirección y siempre muestra lo que corresponde ahora:
 * primero las preguntas, después la propuesta, después la firma. El cliente no
 * tiene que entender en qué etapa está ni buscar cuál de los tres correos era.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ token: string }>;

export const metadata: Metadata = {
  title: 'Tu proyecto | Silvano Puccini',
  robots: { index: false, follow: false },
};

async function loadEstado(token: string) {
  const supabase = getSupabaseAdmin();

  const { data: lead } = await supabase
    .from('leads')
    .select('id, nombre, propuesta_token, proposal_sent_at, propuesta_respuesta, contrato_firmado_at')
    .eq('lead_token', token)
    .maybeSingle();

  if (!lead) return null;

  const { data: questionnaire } = await supabase
    .from('questionnaires')
    .select('token, completed_at')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    nombre: (lead.nombre as string | null) ?? '',
    etapa: etapaDelCliente({
      cuestionarioToken: (questionnaire?.token as string | null) ?? null,
      cuestionarioCompleto: questionnaire?.completed_at != null,
      propuestaToken: (lead.propuesta_token as string | null) ?? null,
      propuestaEnviada: lead.proposal_sent_at != null,
      propuestaRespuesta: (lead.propuesta_respuesta as string | null) ?? null,
      contratoFirmadoAt: (lead.contrato_firmado_at as string | null) ?? null,
    }),
  };
}

const MENSAJES = {
  listo: {
    titulo: 'Ya está todo firmado',
    texto: 'Te escribo por mail con los datos que hacen falta para arrancar. Si necesitás algo antes, respondé ese mismo correo.',
  },
  cerrada: {
    titulo: 'Quedamos en contacto',
    texto: 'Esta propuesta quedó cerrada. Si cambia algo de tu lado, escribime y la retomamos donde la dejamos.',
  },
  espera: {
    titulo: 'Estoy preparando tu propuesta',
    texto: 'Con lo que me contaste ya puedo armarla. Te llega por mail y la vas a poder ver acá mismo, en este link.',
  },
} as const;

export default async function ClientePage({ params }: { params: Params }) {
  const { token } = await params;
  const estado = await loadEstado(token);

  if (!estado) notFound();

  const { etapa, href } = estado.etapa;
  if (href) redirect(href);

  const mensaje = MENSAJES[etapa as keyof typeof MENSAJES] ?? MENSAJES.espera;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center px-4 py-24">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary">
          Tu proyecto
        </p>
      </Reveal>
      <Reveal>
        <h1 className="mt-3 text-3xl font-medium text-text-primary sm:text-4xl">
          {estado.nombre ? `${estado.nombre}, ${mensaje.titulo.toLowerCase()}` : mensaje.titulo}
        </h1>
      </Reveal>
      <Reveal>
        <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">{mensaje.texto}</p>
      </Reveal>
      <Reveal>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
          Guardá este link: siempre te va a mostrar en qué punto estamos.
        </p>
      </Reveal>
    </main>
  );
}
