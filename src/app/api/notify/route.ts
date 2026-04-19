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

    <!-- Header -->
    <div style="padding:32px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;">
      <div style="font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#00d4d4;margin:0 0 6px;">
        El Radar
      </div>
      <div style="font-family:'Space Grotesk',sans-serif;font-size:11px;color:#8c909f;letter-spacing:0.18em;text-transform:uppercase;">
        Silvano Puccini · Full Stack Dev
      </div>
    </div>

    <!-- Content -->
    <div style="padding:40px 32px;">

      <!-- Eyebrow -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
        <span style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;">
          NUEVA NOTA · Nº ${opts.issue}
        </span>
        <span style="width:4px;height:4px;background:rgba(255,255,255,0.15);border-radius:50%;display:inline-block;"></span>
        <span style="font-family:'Space Grotesk',sans-serif;font-size:11px;color:${cat.text};letter-spacing:0.18em;text-transform:uppercase;">
          ${opts.keyword.toUpperCase()}
        </span>
      </div>

      <!-- Title -->
      <h1 style="font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;line-height:1.25;margin:0 0 24px;">
        ${opts.title}
      </h1>

      <!-- Excerpt with left border -->
      <p style="font-size:16px;color:rgba(221,226,248,0.85);line-height:1.7;margin:0 0 24px;border-left:2px solid ${cat.text};padding-left:16px;">
        ${opts.excerpt}
      </p>

      <!-- Meta -->
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#8c909f;margin-bottom:32px;">
        <span>${opts.readingTime}</span>
        <span>·</span>
        <span>${opts.date}</span>
        <span>·</span>
        <span style="display:inline-block;background:${cat.bg};color:${cat.text};border:1px solid ${cat.border};border-radius:20px;padding:2px 10px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-family:'Space Grotesk',sans-serif;">
          ${opts.category}
        </span>
      </div>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <a href="${opts.postUrl}"
               style="display:inline-block;background:#00d4d4;color:#050810;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
              Leer más →
            </a>
          </td>
        </tr>
      </table>

      <!-- Sign off -->
      <div style="margin-top:48px;padding-top:32px;border-top:1px solid rgba(255,255,255,0.05);">
        <p style="font-family:'Space Grotesk',sans-serif;font-size:16px;color:#dde2f8;margin:0;">
          Un abrazo, Silvano.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:rgba(0,0,0,0.2);padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);">
      <p style="font-size:11px;color:rgba(140,144,159,0.6);margin:0;line-height:1.8;">
        Recibís este email porque te suscribiste a El Radar.
        <br/>
        <a href="${opts.unsubUrl}" style="color:rgba(140,144,159,0.6);text-decoration:underline;">Desuscribirse</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.NOTIFY_SECRET}`) {
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
