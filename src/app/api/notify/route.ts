import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAllBlogPosts } from '@/lib/mdx';
import { CATEGORY_COLOR } from '@/lib/resend';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function buildEmail(opts: {
  title: string;
  excerpt: string;
  category: string;
  issue: string;
  keyword: string;
  readingTime: string;
  date: string;
  postUrl: string;
  unsubUrl: string;
}): string {
  const cat = CATEGORY_COLOR[opts.category] ?? CATEGORY_COLOR['Producto'];

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>El Radar</title>
</head>
<body style="margin:0;padding:40px 16px;background:#050810;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:600px;width:100%;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">

    <!-- Header — logo El Radar -->
    <div style="padding:32px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;">
      <!-- est. 2026 con líneas cortas -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td style="border-bottom:1px solid rgba(255,255,255,0.15);width:40%;"></td>
          <td style="white-space:nowrap;padding:0 8px;font-family:monospace;font-size:8px;color:#8c909f;letter-spacing:0.22em;text-transform:uppercase;">est. 2026</td>
          <td style="border-bottom:1px solid rgba(255,255,255,0.15);width:40%;"></td>
        </tr>
      </table>
      <!-- El Radar en una sola línea — tabla para compatibilidad mobile -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 4px;">
        <tr>
          <td style="vertical-align:bottom;padding-bottom:2px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.32em;text-transform:uppercase;">El</span>
          </td>
          <td style="vertical-align:bottom;padding-left:5px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#94a3b8;letter-spacing:0.14em;text-transform:uppercase;">Radar</span>
          </td>
        </tr>
      </table>
      <!-- tagline sin líneas -->
      <div style="font-family:monospace;font-size:7px;color:#8c909f;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:14px;">
        arquitectura · código · producto
      </div>
      <!-- Silvano Puccini en cyan -->
      <div style="font-family:'Space Grotesk',sans-serif;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;">
        Silvano Puccini · Full Stack Dev
      </div>
    </div>

    <!-- Content -->
    <div style="padding:40px 32px;">

      <!-- Eyebrow: línea 1 en una línea, keyword en línea 2 -->
      <p style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 8px;text-align:center;line-height:1.6;">
        <span style="color:#94a3b8;">El Radar</span>
        <span style="color:rgba(255,255,255,0.2);margin:0 6px;">·</span>
        <span style="color:#00d4d4;">Nueva nota · Nº ${opts.issue}</span>
      </p>
      <p style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 40px;text-align:center;">
        <span style="color:${cat.text};">${opts.keyword.toUpperCase()}</span>
      </p>

      <!-- Card del post -->
      <div style="border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;">

        <!-- Card header: categoría + número -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
          <tr>
            <td>
              <span style="display:inline-block;background:${cat.bg};color:${cat.text};border:1px solid ${cat.border};border-radius:20px;padding:4px 12px;font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">
                ${opts.category}
              </span>
            </td>
            <td style="text-align:right;">
              <span style="font-family:'Space Grotesk',sans-serif;font-size:10px;color:#8c909f;letter-spacing:0.14em;text-transform:uppercase;">
                Nº ${opts.issue}
              </span>
            </td>
          </tr>
        </table>

        <!-- Card body -->
        <div style="padding:32px 24px 28px;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;margin:0 0 20px;letter-spacing:-0.01em;">
            ${opts.title}
          </h2>
          <p style="font-size:14px;color:rgba(221,226,248,0.8);line-height:1.7;margin:0 0 28px;border-left:2px solid ${cat.text};padding-left:14px;">
            ${opts.excerpt}
          </p>

          <!-- Meta + CTA en misma fila -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-top:4px;">
            <tr>
              <td style="vertical-align:middle;">
                <span style="font-family:'Space Grotesk',sans-serif;font-size:14px;color:#8c909f;letter-spacing:0.06em;">
                  ${opts.readingTime} · ${opts.date}
                </span>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <a href="${opts.postUrl}" style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:#00d4d4;text-decoration:none;letter-spacing:0.04em;">
                  Leer más →
                </a>
              </td>
            </tr>
          </table>
        </div>

      </div>

    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0 0 4px;line-height:1.8;">Recibís este email porque te suscribiste a El Radar.</p>
      <a href="${opts.unsubUrl}" style="font-size:11px;color:rgba(140,144,159,0.5);text-decoration:underline;">Desuscribirse</a>
    </div>

  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    const cookie = req.cookies.get('admin_session')?.value;
    const secret = process.env.NOTIFY_SECRET;
    if (auth !== `Bearer ${secret}` && cookie !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { slug } = body as { slug: string };

    if (!slug) {
      return NextResponse.json({ error: 'slug es requerido.' }, { status: 400 });
    }

    const allPosts = getAllBlogPosts();
    const post = allPosts.find((p) => p.slug === slug);

    if (!post) {
      return NextResponse.json({ error: `Post "${slug}" no encontrado.` }, { status: 404 });
    }

    const issueNum   = String(post.issue).padStart(2, '0');
    const issueLabel = `Nueva nota · Nº ${issueNum}`;
    const postUrl    = `https://silvanopuccini.dev/es/blog/${slug}`;

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

    const emails = subscribers.map((s) => ({
      from: 'Silvano Puccini <hola@silvanopuccini.dev>',
      to:   s.email,
      subject: `El Radar · ${issueLabel} — ${post.title}`,
      html: buildEmail({
        title:       post.title,
        excerpt:     post.excerpt ?? '',
        category:    post.category,
        issue:       issueNum,
        keyword:     post.keyword ?? post.category,
        readingTime: post.readingTime ?? '5 min',
        date:        formatDate(post.date),
        postUrl,
        unsubUrl: `https://silvanopuccini.dev/unsubscribe?email=${encodeURIComponent(s.email)}`,
      }),
    }));

    const { data, error: sendError } = await resend.batch.send(emails);

    if (sendError) {
      console.error('[notify] Resend batch error:', sendError);
      return NextResponse.json({ error: 'Error al enviar emails.' }, { status: 500 });
    }

    await getSupabaseAdmin()
      .from('newsletters_sent')
      .insert({ title: post.title, slug, recipients_count: subscribers.length });

    return NextResponse.json({ success: true, sent: subscribers.length, data });

  } catch (err) {
    console.error('[notify] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado.' },
      { status: 500 }
    );
  }
}
