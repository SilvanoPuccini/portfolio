import { NextRequest, NextResponse } from 'next/server';
import { servicioPorNombre } from '@/content/servicios';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token?: string; answers?: unknown };
    const { token, answers } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    if (answers == null) {
      return NextResponse.json({ error: 'Answers are required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: questionnaire, error: selectError } = await supabase
      .from('questionnaires')
      .select('id, lead_id, completed_at')
      .eq('token', token)
      .single();

    if (selectError || !questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    if (questionnaire.completed_at != null) {
      return NextResponse.json(
        { error: 'This questionnaire has already been completed.' },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from('questionnaires')
      .update({
        answers,
        completed_at: new Date().toISOString(),
      })
      .eq('id', questionnaire.id);

    if (updateError) throw updateError;

    // El servicio que eligió en la primera pregunta queda en la venta: es lo
    // que después pretilda el presupuesto y categoriza al cliente. Si no se
    // copia acá, esa respuesta queda enterrada en un jsonb.
    const elegido = servicioPorNombre((answers as Record<string, unknown>)?.servicio as string);
    if (elegido && questionnaire.lead_id) {
      await supabase.from('leads').update({ service: elegido.slug }).eq('id', questionnaire.lead_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/questionnaire] POST error:', err);
    return NextResponse.json({ error: 'Error saving answers.' }, { status: 500 });
  }
}
