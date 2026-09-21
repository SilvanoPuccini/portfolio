import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { sendCrmEmail } from '@/lib/resend';
import { questionnaireInviteHtml } from '@/lib/email-templates/questionnaire-invite';

export const dynamic = 'force-dynamic';

/**
 * El cuestionario previo a la llamada.
 *
 * Antes cada click creaba uno nuevo: dos correos, dos links distintos, y el
 * cliente contestando el que encontrara primero mientras el otro quedaba
 * abierto. Ahora hay UNO por lead: si ya está enviado no se manda de nuevo
 * salvo que se pida el reenvío, y en ese caso viaja el MISMO link, no otro.
 */

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
const urlFor = (token: string) => `${siteUrl()}/questionnaire/${token}`;

async function currentQuestionnaire(leadId: string) {
  const { data } = await getSupabaseAdmin()
    .from('questionnaires')
    .select('id, token, created_at, completed_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as { id: string; token: string; created_at: string; completed_at: string | null } | null;
}

/** El estado, para que el panel no ofrezca mandar lo que ya se mandó. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const questionnaire = await currentQuestionnaire(id);

  if (!questionnaire) return NextResponse.json({ enviado: false });

  return NextResponse.json({
    enviado: true,
    enviadoEl: questionnaire.created_at,
    completadoEl: questionnaire.completed_at,
    url: urlFor(questionnaire.token),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({})) as { reenviar?: boolean };

    const { data: lead, error: leadError } = await getSupabaseAdmin()
      .from('leads')
      .select('nombre, email')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const existing = await currentQuestionnaire(id);

    // Ya lo contestó: mandarlo de nuevo le pide el trabajo dos veces.
    if (existing?.completed_at) {
      return NextResponse.json({
        error: 'Este cliente ya completó el cuestionario.',
        completadoEl: existing.completed_at,
      }, { status: 409 });
    }

    // Enviado y sin contestar: se reenvía solo si se pide, y con el mismo link.
    if (existing && !body.reenviar) {
      return NextResponse.json({
        yaEnviado: true,
        enviadoEl: existing.created_at,
        url: urlFor(existing.token),
      }, { status: 409 });
    }

    let token = existing?.token;
    let questionnaireId = existing?.id;

    if (!existing) {
      const { data: created, error: insertError } = await getSupabaseAdmin()
        .from('questionnaires')
        .insert({ lead_id: id })
        .select('id, token')
        .single();

      if (insertError) throw insertError;
      token = created.token;
      questionnaireId = created.id;
    }

    await sendCrmEmail(
      lead.email,
      body.reenviar ? 'Te reenvío el cuestionario de tu proyecto' : 'Unas preguntas antes de nuestra llamada',
      questionnaireInviteHtml({ name: lead.nombre, email: lead.email }, urlFor(token as string)),
    );

    return NextResponse.json(
      { id: questionnaireId, reenviado: Boolean(existing) },
      { status: existing ? 200 : 201 },
    );
  } catch (err) {
    console.error('[admin/leads/[id]/questionnaire] POST error:', err);
    return NextResponse.json({ error: 'Error sending questionnaire.' }, { status: 500 });
  }
}
