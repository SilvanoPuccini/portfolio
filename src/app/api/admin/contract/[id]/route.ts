import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { buildContract, Packer, type ContractData } from '@/lib/contract-template';

export const dynamic = 'force-dynamic';

const LEGAL_FALLBACK =
  'Este contrato se regirá por las leyes de la República Argentina. ' +
  'Para cualquier controversia, las partes se someten a la jurisdicción de los ' +
  'tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.';

async function generateLegalClause(country: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return LEGAL_FALLBACK;

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Sanitize country: strip anything that isn't alphanumeric, spaces, or basic punctuation
    const safeCountry = country.replace(/[^\p{L}\p{N}\s.,'-]/gu, '').slice(0, 100);

    const prompt =
      `Generate a brief applicable law and jurisdiction clause for a web development service ` +
      `contract between a provider in Buenos Aires, Argentina and a client in ${safeCountry}. ` +
      `Write in Spanish. 2-3 sentences maximum. Professional legal tone.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return text || LEGAL_FALLBACK;
  } catch (err) {
    console.error('[contract/legal-clause] AI generation failed:', err);
    return LEGAL_FALLBACK;
  }
}

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

    // Generate jurisdiction clause from AI if country is known
    const country = (lead.pais as string | null) ?? '';
    const legalClause = country
      ? await generateLegalClause(country)
      : LEGAL_FALLBACK;

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
