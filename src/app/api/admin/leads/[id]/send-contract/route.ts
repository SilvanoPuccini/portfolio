import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { contractReadyHtml } from '@/lib/email-templates/contract-ready';
import { buildContractDoc } from '@/lib/leads/documents';

import { advanceOn } from '@/lib/leads/pipeline';

/** La cláusula por defecto. El correo no pide una a medida: costaría una
 *  llamada al modelo por envío y el contrato ya viaja con las condiciones. */
const LEGAL_FALLBACK =
  'Este contrato se regirá por las leyes de la República Argentina. ' +
  'Para cualquier controversia, las partes se someten a la jurisdicción de los ' +
  'tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.';

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

    // Sin el contrato adjunto no hay nada que firmar: el correo no sale.
    const doc = await buildContractDoc(id, LEGAL_FALLBACK);
    if (!doc) {
      return NextResponse.json({ error: 'No se pudo generar el contrato.' }, { status: 500 });
    }

    try {
      await sendCrmEmail(
        lead.email,
        'Tu contrato está listo para firmar',
        contractReadyHtml({ name: lead.nombre, email: lead.email }),
        [{ filename: doc.filename, content: doc.buffer }],
      );
    } catch (emailErr) {
      console.error('[send-contract] Resend error:', emailErr);
      return NextResponse.json({ error: 'Failed to send contract email.' }, { status: 502 });
    }

    // Igual que la propuesta: la fecha sola no alcanzaba. El lead se movía
    // en la realidad y no en el panel, y ese desfasaje es lo que volvía
    // inservible la lista.
    const nextState = advanceOn('contrato_enviado', lead.estado ?? '');

    const { error: updateError } = await getSupabaseAdmin()
      .from('leads')
      .update({
        contract_sent_at: new Date().toISOString(),
        ...(nextState ? { estado: nextState } : {}),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, ...(nextState ? { estado: nextState } : {}) });
  } catch (err) {
    console.error('[admin/leads/[id]/send-contract] POST error:', err);
    return NextResponse.json({ error: 'Error sending contract.' }, { status: 500 });
  }
}
