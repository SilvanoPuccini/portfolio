import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * El cuestionario previo a la llamada, uno por lead.
 *
 * Antes cada click del panel creaba uno nuevo: dos correos, dos links, y el
 * cliente contestando el que encontrara primero mientras el otro quedaba
 * abierto. Hay UNO por venta y siempre viaja el mismo.
 *
 * Devuelve `null` cuando ya está contestado: en ese caso no hay nada que
 * pedirle, y mandarle el link igual sería pedirle el trabajo dos veces.
 */
export async function asegurarCuestionario(leadId: string): Promise<string | null> {
  const db = getSupabaseAdmin();

  const { data } = await db
    .from('questionnaires')
    .select('token, completed_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const existente = data as { token: string; completed_at: string | null } | null;

  if (existente) return existente.completed_at ? null : existente.token;

  const { data: creado, error } = await db
    .from('questionnaires')
    .insert({ lead_id: leadId })
    .select('token')
    .single();

  if (error || !creado) {
    console.error('[cuestionario] No se pudo crear:', error);
    return null;
  }

  return (creado as { token: string }).token;
}
