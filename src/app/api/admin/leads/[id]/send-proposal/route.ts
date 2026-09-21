import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { proposalReadyHtml } from '@/lib/email-templates/proposal-ready';
import { buildProposalDoc } from '@/lib/leads/documents';
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
      .select('*')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    // La propuesta es la PÁGINA, no un adjunto: se manda el link y nada más.
    // Antes viajaba además un .docx en inglés, así que el cliente recibía la
    // misma propuesta dos veces y una de las dos no estaba en su idioma.
    //
    // El documento se sigue generando acá por un motivo: si no hay presupuesto
    // guardado tampoco hay propuesta que mandar, y esto lo detecta antes de
    // que salga un correo con una página vacía.
    const doc = await buildProposalDoc(id);
    if (!doc) {
      return NextResponse.json({
        error: 'Guardá el presupuesto antes de mandar la propuesta: sin monto ni horas el documento sale vacío.',
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
          responseUrl: `${siteUrl}/propuesta/${token}`,
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
