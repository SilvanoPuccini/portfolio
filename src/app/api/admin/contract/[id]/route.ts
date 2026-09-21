import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { buildContract, Packer, type ContractData } from '@/lib/contract-template';
import { legalClauseFor } from '@/lib/leads/legal-clause';

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
    const supabase = getSupabaseAdmin();

    // Fetch lead and rate config in parallel
    const [leadResult, configResult] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).single(),
      supabase.from('rate_config').select('tarifa_hora, buffer_pct').eq('id', 1).single(),
    ]);

    if (leadResult.error) throw leadResult.error;

    const lead = leadResult.data as Record<string, unknown>;
    const config = configResult.data ?? { tarifa_hora: 35, buffer_pct: 20 };

    // La cláusula es fija por país. Antes la escribía un modelo en cada
    // descarga: el contrato salía distinto cada vez y una vez se imprimió el
    // prefacio del modelo adentro del documento.
    const country = (lead.pais as string | null) ?? '';
    const legalClause = legalClauseFor(country);


    // Build contract data from lead + config, with sensible defaults
    const hourlyRate = (config as { tarifa_hora: number }).tarifa_hora;
    const totalHours = (lead.horas_calculadas as number | null) ?? 0;
    const totalPrice = (lead.monto_presupuestado as number | null) ?? totalHours * hourlyRate;

    const contractData: ContractData = {
      clientName: (lead.titular as string | null) || (lead.nombre as string) || 'Cliente',
      clientLocation: (lead.localidad as string | null) ?? (country || 'Sin especificar'),
      clientCountry: country || 'Sin especificar',
      projectDescription:
        (lead.que_construir as string | null) ??
        (lead.diagnostico_requerimiento as string | null) ??
        'Desarrollo web a medida según especificaciones acordadas.',
      deliverables:
        (lead.diagnostico_requerimiento as string | null) ??
        (lead.que_construir as string | null) ??
        'Entregables según especificaciones acordadas entre las partes.',
      totalHours,
      totalPrice,
      hourlyRate,
      paymentTerms: '50% al inicio, 50% contra entrega',
      startDate: new Date().toISOString().split('T')[0],
      estimatedWeeks: Math.ceil(totalHours / 40) || 4,
      legalClause,
    };

    // Generate the .docx buffer
    const doc = buildContract(contractData);
    const nodeBuffer = await Packer.toBuffer(doc);
    // NextResponse BodyInit accepts ArrayBuffer but not Node Buffer directly
    const arrayBuffer = nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength,
    ) as ArrayBuffer;

    const clientSlug = contractData.clientName.replace(/\s+/g, '-').toLowerCase();
    const filename = `contrato-${clientSlug}.docx`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(nodeBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error('[admin/contract/[id]] GET error:', err);
    return NextResponse.json({ error: 'Error al generar el contrato.' }, { status: 500 });
  }
}
