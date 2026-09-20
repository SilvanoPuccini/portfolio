import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { missingFromForm, parseAnswers } from '@/lib/leads/call-guide';
import { draftRecommendation, type CatalogModule } from '@/lib/leads/recommendation';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Qué ofrecerle a este cliente.
 *
 * GET devuelve la última recomendación guardada; con `?refresh=1` escribe una
 * nueva. Igual que el seguimiento: la IA propone, la persona decide, y nada
 * se manda solo.
 */

const LEAD_COLUMNS = [
  'nombre', 'tipo_proyecto', 'que_construir', 'secciones', 'problema', 'presupuesto_rango',
  'plazo', 'integraciones', 'idiomas', 'tiene_login', 'tiene_pagos', 'tiene_admin',
  'tiene_marca', 'tiene_contenido', 'notas_llamada', 'recomendacion',
  'diagnostico_objetivo', 'diagnostico_situacion', 'diagnostico_requerimiento',
  'diagnostico_dolor', 'diagnostico_deseo', 'diagnostico_preocupaciones', 'guia_respuestas',
].join(', ');

type LeadRow = Record<string, unknown> & { recomendacion?: unknown };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getSupabaseAdmin();

  const { data, error } = await db.from('leads').select(LEAD_COLUMNS).eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

  const lead = data as unknown as LeadRow;
  const refresh = req.nextUrl.searchParams.has('refresh');
  if (!refresh && lead.recomendacion) {
    return NextResponse.json({ ...(lead.recomendacion as object), cached: true });
  }

  const { data: modules } = await db
    .from('modulos_precio').select('slug, label, horas_min, horas_max').order('label');

  const pick = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, lead[key]]));
  const diagnostico = {
    objetivo: lead.diagnostico_objetivo, situacion: lead.diagnostico_situacion,
    requerimiento: lead.diagnostico_requerimiento, dolor: lead.diagnostico_dolor,
    deseo: lead.diagnostico_deseo, preocupaciones: lead.diagnostico_preocupaciones,
  } as Record<string, string | null | undefined>;

  const formulario = pick([
    'tipo_proyecto', 'que_construir', 'secciones', 'problema', 'presupuesto_rango', 'plazo',
    'integraciones', 'idiomas', 'tiene_login', 'tiene_pagos', 'tiene_admin', 'tiene_marca',
    'tiene_contenido', 'notas_llamada',
  ]);

  try {
    const recommendation = await draftRecommendation({
      formulario,
      diagnostico,
      huecos: missingFromForm(formulario),
      // Lo crudo de la llamada: pregunta por pregunta, sin el resumen de por medio.
      respuestas: parseAnswers(lead.guia_respuestas),
      catalogo: (modules ?? []) as CatalogModule[],
    });

    await db.from('leads').update({ recomendacion: recommendation }).eq('id', id);

    return NextResponse.json(recommendation);
  } catch (reason) {
    // Sin cuota no hay recomendación, y la llamada ya pasó: el diagnóstico
    // sigue cargado y la propuesta se puede armar igual, a mano.
    const detail = reason instanceof Error ? reason.message : String(reason);
    return NextResponse.json({ error: `No se pudo armar la recomendación: ${detail}` }, { status: 503 });
  }
}
