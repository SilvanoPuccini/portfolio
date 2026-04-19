import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAllBlogPosts } from '@/lib/mdx';
import { postCardHtml, CATEGORY_COLOR } from '@/lib/resend';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.NOTIFY_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { slug } = body as { title?: string; slug: string; excerpt?: string };

    if (!slug) {
      return NextResponse.json({ error: 'slug es requerido.' }, { status: 400 });
    }

    // Resolver todos los datos del post desde el slug
    const allPosts = getAllBlogPosts();
    const post = allPosts.find((p) => p.slug === slug);

    if (!post) {
      return NextResponse.json({ error: `Post "${slug}" no encontrado.` }, { status: 404 });
    }

    const issueNum  = String(post.issue).padStart(2, '0');
    const issueLabel = `Nueva nota · Nº ${issueNum}`;
    const postUrl   = `https://silvanopuccini.dev/es/blog/${slug}`;
    const cat       = CATEGORY_COLOR[post.category] ?? CATEGORY_COLOR['Producto'];

    // Suscriptores activos
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

    const emails = subscribers.map((s) => {
      const unsubUrl = `https://silvanopuccini.dev/unsubscribe?email=${encodeURIComponent(s.email)}`;

      const card = postCardHtml({
        title:       post.title,
        excerpt:     post.excerpt ?? '',
        category:    post.category,
        issue:       issueNum,
        readingTime: post.readingTime ?? '5 min',
        date:        formatDate(post.date),
        postUrl,
        keyword:     post.keyword,
      });

      const html = `
<div style="max-width:580px;margin:0 auto;font-family:sans-serif;background:#0a0a14;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
  <!-- Header -->
  <div style="padding:20px 32px;border-bottom:1px solid #1a1a2a;">
    <span style="font-family:monospace;font-size:11px;color:#00d4d4;letter-spacing:0.14em;text-transform:uppercase;">Silvano Puccini · Full Stack Dev</span>
  </div>
  <!-- Body -->
  <div style="padding:32px;">
    <p style="font-family:monospace;font-size:10px;color:${cat.text};letter-spacing:0.18em;text-transform:uppercase;margin:0 0 6px;">El Radar · ${issueLabel}</p>
    <h1 style="font-size:22px;font-weight:700;color:#f0f0f0;margin:0 0 6px;line-height:1.3;">${post.title}</h1>
    <div style="width:32px;height:2px;background:#00d4d4;margin:16px 0 20px;"></div>
    <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">${post.excerpt ?? ''}</p>

    ${card}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td>
          <a href="${postUrl}" style="display:inline-block;background:#00d4d4;color:#0a0a12;font-size:13px;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;">Leer la nota →</a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#475569;margin:28px 0 0;line-height:1.65;">
      Un abrazo,<br><span style="color:#94a3b8;">Silvano</span>
    </p>
  </div>
  <!-- Footer -->
  <div style="padding:16px 32px;border-top:1px solid #1a1a2a;">
    <p style="font-size:11px;font-family:monospace;color:#475569;margin:0;">
      Recibís este email porque te suscribiste a El Radar.&nbsp;·&nbsp;
      <a href="${unsubUrl}" style="color:#475569;text-decoration:underline;">Desuscribirse</a>
    </p>
  </div>
</div>`;

      return {
        from: 'Silvano Puccini <hola@silvanopuccini.dev>',
        to:   s.email,
        subject: `El Radar · ${issueLabel} — ${post.title}`,
        html,
      };
    });

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
