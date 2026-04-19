import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
  // Protección con bearer token
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.NOTIFY_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, slug, excerpt } = body as {
    title: string;
    slug: string;
    excerpt: string;
  };

  if (!title || !slug || !excerpt) {
    return NextResponse.json(
      { error: 'title, slug y excerpt son requeridos.' },
      { status: 400 }
    );
  }

  // Traer todos los suscriptores activos
  const { data: subscribers, error: dbError } = await getSupabaseAdmin()
    .from('subscribers')
    .select('email')
    .eq('status', 'active');

  if (dbError) {
    console.error('[notify] Supabase error:', dbError);
    return NextResponse.json({ error: 'Error al obtener suscriptores.' }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: 'No hay suscriptores activos.', sent: 0 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const postUrl = `https://silvanopuccini.dev/blog/${slug}`;

  // Enviar en batch (Resend soporta hasta 100 por llamada)
  const emails = subscribers.map((s) => ({
    from: 'Silvano Puccini <hola@silvanopuccini.dev>',
    to: s.email,
    subject: `El Radar · ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#0a0a14;color:#e2e8f0;">
        <p style="color:#00d4d4;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">El Radar · Nueva nota</p>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:16px;color:#ffffff;">${title}</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin-bottom:32px;">${excerpt}</p>
        <a href="${postUrl}" style="background:#00d4d4;color:#0a0a14;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Leer la nota →
        </a>
        <hr style="border:none;border-top:1px solid #1e293b;margin:40px 0;" />
        <p style="color:#475569;font-size:12px;">
          Recibís este email porque te suscribiste a El Radar.<br/>
          <a href="https://silvanopuccini.dev/unsubscribe?email=${encodeURIComponent(s.email)}" style="color:#475569;">Desuscribirse</a>
        </p>
      </div>
    `,
  }));

  const { data, error: sendError } = await resend.batch.send(emails);

  if (sendError) {
    console.error('[notify] Resend batch error:', sendError);
    return NextResponse.json({ error: 'Error al enviar emails.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    sent: subscribers.length,
    data,
  });
  } catch (err) {
    console.error('[notify] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado.' },
      { status: 500 }
    );
  }
}
