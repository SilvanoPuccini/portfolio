import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { buildProposal, Packer } from '@/lib/proposal-template';
import { proposalModules } from '@/lib/leads/selected-modules';

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

    const { data: lead, error: leadError } = await getSupabaseAdmin()
      .from('leads')
      .select('nombre, email, tipo_proyecto, monto_presupuestado, horas_calculadas, plazo, modulos_seleccionados')
      .eq('id', id)
      .single();

    if (leadError) throw leadError;

    if (lead.monto_presupuestado == null || lead.horas_calculadas == null) {
      return NextResponse.json(
        { error: 'Budget must be saved before generating a proposal' },
        { status: 400 },
      );
    }

    const { data: config } = await getSupabaseAdmin()
      .from('rate_config')
      .select('tarifa_hora')
      .eq('id', 1)
      .single();

    const hourlyRate: number = config?.tarifa_hora ?? 35;
    const totalHours: number = lead.horas_calculadas;
    const totalPrice: number = lead.monto_presupuestado;

    // El alcance cotizado para este lead, no el catálogo entero.
    const moduleList = proposalModules(lead.modulos_seleccionados);

    const estimatedWeeks = lead.plazo
      ? Math.ceil(totalHours / (hourlyRate * 0.8))
      : Math.ceil(totalHours / 40);

    const doc = buildProposal({
      clientName: lead.nombre,
      projectName: `${lead.nombre} — ${lead.tipo_proyecto ?? 'Project'}`,
      problemSummary: 'Based on our discovery call, we identified your key challenges and goals.',
      solutionSummary: 'We propose a tailored development solution addressing your specific needs.',
      modules: moduleList,
      totalHours,
      totalPrice,
      hourlyRate,
      estimatedWeeks,
      paymentTerms: '50% at project start, 50% on final delivery',
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `proposal-${lead.nombre.replace(/\s+/g, '-').toLowerCase()}.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error('[admin/proposal/[id]] GET error:', err);
    return NextResponse.json({ error: 'Error generating proposal.' }, { status: 500 });
  }
}
