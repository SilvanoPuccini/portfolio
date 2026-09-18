import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { rebookingInviteHtml } from '@/lib/email-templates/rebooking-invite';

export const dynamic = 'force-dynamic';

/**
 * Le manda al cliente el link para reagendar la llamada.
 *
 * No toca el estado: el lead sigue en `no_show` hasta que reserve de verdad, y
 * en ese momento el webhook de Cal.com lo mueve solo. Marcar «reagendado» acá
 * sería volver a contar lo que queremos que pase en lugar de lo que pasó.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookingUrl = process.env.NEXT_PUBLIC_CALCOM_LINK;
  if (!bookingUrl) {
    return NextResponse.json({
      error: 'Falta configurar NEXT_PUBLIC_CALCOM_LINK: sin link no hay dónde reservar.',
    }, { status: 503 });
  }

  const { id } = await params;
  const { data: lead, error } = await getSupabaseAdmin()
    .from('leads').select('nombre, email').eq('id', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lead?.email) return NextResponse.json({ error: 'El lead no tiene correo.' }, { status: 404 });

  try {
    await sendCrmEmail(
      lead.email,
      '¿Buscamos otro horario?',
      rebookingInviteHtml({ name: lead.nombre, bookingUrl }),
    );
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : String(reason);
    return NextResponse.json({ error: `No se pudo enviar: ${detail}` }, { status: 502 });
  }

  return NextResponse.json({ enviado: true });
}
