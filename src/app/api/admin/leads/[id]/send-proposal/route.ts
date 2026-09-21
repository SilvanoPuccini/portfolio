import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { proposalReadyHtml } from '@/lib/email-templates/proposal-ready';
import { clienteUrl } from '@/lib/leads/client-stage';
import { advanceOn } from '@/lib/leads/pipeline';
import { buildDiagnosisDoc } from '@/lib/leads/diagnosis-doc';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data: lead, error: leadError } = await getSupabaseAdmin()
      .from('leads')
      .select('nombre, email, estado, lead_token, monto_presupuestado, horas_calculadas, modulos_seleccionados, mantenimiento_mensual, sena_pct, pago_unico, recomendacion, diagnostico_dolor, diagnostico_situacion, diagnostico_requerimiento')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    // La propuesta es la PÁGINA: no se genera ni se adjunta ningún documento.
    // Lo único que hay que verificar es que haya presupuesto, porque sin monto
    // la página sale vacía y eso es peor que no mandar nada.
    if (lead.monto_presupuestado == null || lead.horas_calculadas == null) {
      return NextResponse.json({
        error: 'Guardá el presupuesto antes de mandar la propuesta: sin monto ni horas la página sale vacía.',
      }, { status: 400 });
    }

    // Un token por envío: si después se manda una propuesta corregida, el
    // link viejo deja de servir y nadie acepta una versión que ya no existe.
    const token = randomUUID();
    // La foto del diagnóstico: lo que el cliente abra va a decir esto, aunque
    // después se toque el presupuesto en el panel.
    const snapshot = buildDiagnosisDoc(lead);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';

    try {
      await sendCrmEmail(
        lead.email,
        'Tu propuesta está lista',
        proposalReadyHtml({
          name: lead.nombre,
          email: lead.email,
          // El cliente abre siempre el mismo link; adentro se resuelve que
          // ahora le toca la propuesta.
          responseUrl: clienteUrl(siteUrl, lead.lead_token as string | null, `${siteUrl}/propuesta/${token}`),
        }),
      );
    } catch (emailErr) {
      console.error('[send-proposal] Resend error:', emailErr);
      return NextResponse.json({ error: 'Failed to send proposal email.' }, { status: 502 });
    }

    // La fecha y el estado se guardan juntos, y solo después de que el correo
    // salió. Antes se guardaba únicamente la fecha: el lead quedaba en «en
    // conversación» con una propuesta ya mandada, y había que acordarse de
    // moverlo a mano. Nadie se acuerda siempre, y por eso la lista mentía.
    const nextState = advanceOn('propuesta_enviada', lead.estado ?? '');

    const { error: updateError } = await getSupabaseAdmin()
      .from('leads')
      .update({
        proposal_sent_at: new Date().toISOString(),
        propuesta_token: token,
        propuesta_snapshot: snapshot,
        // La propuesta nueva se responde de cero: lo contestado era de la anterior.
        propuesta_respuesta: null,
        propuesta_respondida_at: null,
        propuesta_rechazo_motivo: null,
        ...(nextState ? { estado: nextState } : {}),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, ...(nextState ? { estado: nextState } : {}) });
  } catch (err) {
    console.error('[admin/leads/[id]/send-proposal] POST error:', err);
    return NextResponse.json({ error: 'Error sending proposal.' }, { status: 500 });
  }
}
