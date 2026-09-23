import { NextRequest, NextResponse } from 'next/server';
import { servicioPorNombre } from '@/content/servicios';
import { getSupabaseAdmin } from '@/lib/supabase';
import { volcarRespuestas, type ColumnasDelLead } from '@/lib/leads/volcado';

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

    // Lo contestado se copia a la venta. Sin esto las respuestas quedan
    // enterradas en un jsonb que solo abre esta pantalla, y la ficha del lead
    // —el semáforo, lo que falta averiguar, la recomendación— arranca vacía
    // como si el cliente no hubiera escrito nada.
    if (questionnaire.lead_id) {
      await volcarEnLaVenta(questionnaire.lead_id, answers);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/questionnaire] POST error:', err);
    return NextResponse.json({ error: 'Error saving answers.' }, { status: 500 });
  }
}

/**
 * Copia a `leads` lo que el cliente acaba de contestar.
 *
 * Se hace en un solo UPDATE con todo junto: el servicio elegido y las cuatro
 * respuestas que tienen columna propia. Nunca pisa lo que ya estaba cargado,
 * porque una corrección hecha a mano en el panel vale más que un formulario
 * contestado apurado.
 *
 * Si algo falla acá, el cuestionario igual quedó guardado: el cliente ya hizo
 * su parte y perder sus respuestas por un problema nuestro sería castigarlo.
 */
async function volcarEnLaVenta(leadId: string, answers: unknown): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    const { data } = await supabase
      .from('leads')
      .select('service, que_construir, problema, plazo, presupuesto_rango')
      .eq('id', leadId)
      .maybeSingle();

    // Sin la fila no se sabe qué está vacío, y escribir a ciegas pisaría lo
    // que ya estaba. Se deja como está.
    if (!data) return;

    const lead = data as ColumnasDelLead & { service?: string | null };
    const cambios: Record<string, string> = { ...volcarRespuestas(answers, lead) };

    // El servicio que eligió en la primera pregunta: es lo que después
    // pretilda el presupuesto y categoriza al cliente.
    const elegido = servicioPorNombre((answers as Record<string, unknown>)?.servicio as string);
    if (elegido && !lead.service) cambios.service = elegido.slug;

    if (Object.keys(cambios).length === 0) return;

    await supabase.from('leads').update(cambios).eq('id', leadId);
  } catch (err) {
    console.error('[api/questionnaire] No se pudo volcar a la venta:', err);
  }
}
