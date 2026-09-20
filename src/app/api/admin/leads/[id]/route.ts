import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { isKnownState } from '@/lib/leads/pipeline';
import { parseSelectedModules } from '@/lib/leads/selected-modules';
import { parseAnswers } from '@/lib/leads/call-guide';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data, error } = await getSupabaseAdmin()
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error('[admin/leads/[id]] GET error:', err);
    return NextResponse.json({ error: 'Error al obtener lead.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    const allowedStrings = [
      'titular', 'localidad', 'pais', 'notas_llamada', 'estado',
      'diagnostico_objetivo', 'diagnostico_situacion', 'diagnostico_requerimiento',
      'diagnostico_dolor', 'diagnostico_deseo', 'diagnostico_preocupaciones',
      'proposal_sent_at', 'ultimo_contacto_at', 'propuesta_respuesta', 'propuesta_rechazo_motivo', 'guia_respuestas', 'contract_sent_at',
    ];
    const allowedNumbers = ['monto_presupuestado', 'horas_calculadas'];


    const updates: Record<string, unknown> = {};
    for (const key of allowedStrings) {
      if (key in body) {
        const v = body[key];
        if (v !== null && typeof v !== 'string') {
          return NextResponse.json({ error: `Field "${key}" must be a string or null.` }, { status: 400 });
        }
        updates[key] = v;
      }
    }
    for (const key of allowedNumbers) {
      if (key in body) {
        const v = body[key];
        if (v !== null && typeof v !== 'number') {
          return NextResponse.json({ error: `Field "${key}" must be a number or null.` }, { status: 400 });
        }
        updates[key] = v;
      }
    }

    // Las respuestas de la llamada, una por pregunta. Los seis campos del
    // diagnóstico viajan aparte, ya resumidos por la guía.
    if ('guia_respuestas' in body) {
      const value = body.guia_respuestas;
      if (value !== null && (typeof value !== 'object' || Array.isArray(value))) {
        return NextResponse.json({ error: 'Field "guia_respuestas" must be an object.' }, { status: 400 });
      }
      updates.guia_respuestas = value === null ? null : parseAnswers(value);
    }

    // El alcance cotizado viaja junto con el presupuesto: lo que se guarda es
    // lo que después dice la propuesta.
    if ('modulos_seleccionados' in body) {
      if (!Array.isArray(body.modulos_seleccionados)) {
        return NextResponse.json({ error: 'Field "modulos_seleccionados" must be an array.' }, { status: 400 });
      }
      updates.modulos_seleccionados = parseSelectedModules(body.modulos_seleccionados);
    }

    // La columna `estado` es text libre: sin esto, un typo entra a la base y
    // crea un estado fantasma que ninguna pantalla sabe mostrar. El recorrido
    // definido en pipeline.ts es la única lista válida.
    if (typeof updates.estado === 'string' && !isKnownState(updates.estado)) {
      return NextResponse.json({
        error: `Estado desconocido: "${updates.estado}".`,
      }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('leads')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/leads/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Error al actualizar lead.' }, { status: 500 });
  }
}
