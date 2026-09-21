import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from '@/content/servicios';
import { planQuestionnaire } from '@/lib/leads/questionnaire-plan';
import { getSupabaseAdmin } from '@/lib/supabase';

/** Los campos del lead que deciden qué falta preguntar. */
const CAMPOS_DEL_PLAN =
  'presupuesto_rango, plazo, problema, que_construir, service, service_data, guia_respuestas';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: questionnaire, error } = await supabase
      .from('questionnaires')
      .select('id, lead_id, completed_at')
      .eq('token', token)
      .single();

    if (error || !questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    if (questionnaire.completed_at != null) {
      return NextResponse.json({ completed: true, questions: [] });
    }

    // El cuestionario se arma con lo que a ESTE lead le falta contestar. Si ya
    // dijo el presupuesto en el formulario, no se lo vuelve a preguntar.
    const { data: lead } = await supabase
      .from('leads')
      .select(CAMPOS_DEL_PLAN)
      .eq('id', questionnaire.lead_id)
      .single();

    // Por defecto en español: el cliente es de la región, no de Silicon Valley.
    const locale: Locale = searchParams.get('lang') === 'en' ? 'en' : 'es';

    return NextResponse.json({
      completed: false,
      questions: planQuestionnaire(lead ?? {}, locale),
    });
  } catch (err) {
    console.error('[api/questionnaire/check] GET error:', err);
    return NextResponse.json({ error: 'Error checking questionnaire.' }, { status: 500 });
  }
}
