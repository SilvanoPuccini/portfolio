import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { proposalReadyHtml } from '@/lib/email-templates/proposal-ready';
import { advanceOn } from '@/lib/leads/pipeline';

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
      .select('nombre, email, estado')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    try {
      await sendCrmEmail(
        lead.email,
        'Your proposal is ready',
        proposalReadyHtml({ name: lead.nombre, email: lead.email }),
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
