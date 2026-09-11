import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAllBlogPosts } from '@/lib/mdx';
import { CATEGORY_COLOR } from '@/lib/resend';
import { generateUnsubToken } from '@/lib/unsub-token';

const SITE_URL = process.env.DISTRIBUTION_BASE_URL ?? 'https://silvanopuccini.dev';

export type SendPostNewsletterResult =
  | { ok: true; sent: number }
  | { ok: false; error: string; status: number };

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function buildEmail(opts: {
  title: string;
  excerpt: string;
  category: string;
  issue: string;
  readingTime: string;
  date: string;
  postUrl: string;
  unsubUrl: string;
  keyword: string;
}): string {
  const cat = CATEGORY_COLOR[opts.category] ?? CATEGORY_COLOR['Producto'];

  const e = {
    title: escapeHtml(opts.title),
    excerpt: escapeHtml(opts.excerpt),
    category: escapeHtml(opts.category),
    issue: escapeHtml(opts.issue),
    readingTime: escapeHtml(opts.readingTime),
    date: escapeHtml(opts.date),
    keyword: escapeHtml(opts.keyword),
  };

  // Cover = color brillante de categoría (como el badge),
  // texto oscuro para que brille siempre. Un solo font (Inter).
  const keywordUpper = e.keyword.toUpperCase();
  // Clave sin acentos para clases CSS por categoría (ej: "automatizacion").
  const catKey = opts.category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  return `<!DOCTYPE html>
<html lang="es">
  <head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>El Radar · Nº ${e.issue} · ${e.title}</title>
    <style>
      @media only screen and (max-width:480px) {
        body { padding:8px 6px !important; }
        .email-cover-keyword { font-size:14px !important; word-wrap:break-word; overflow-wrap:break-word; word-break:break-word; }
        .email-excerpt { border-left-width:6px !important; }
        .email-divider { border-top-color:#5a8ab0 !important; border-bottom-color:#5a8ab0 !important; }
        .email-excerpt-automatizacion { border-left-color:#f59e0b !important; }
        .email-header-title { font-size:20px !important; }
        .email-header-name { font-size:11px !important; }
        .email-tagline { font-size:9px !important; }
        .email-eyebrow { font-size:11px !important; }
      }
    </style>
  </head>
<body style="margin:0;padding:20px 12px;background:#050810;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:600px;width:100%;margin:0 auto;background:#14466b;border:1px solid #2f5a7d;border-radius:16px;overflow:hidden;">

    <!-- HEADER -->
    <div style="padding:32px 24px 24px;border-bottom:1px solid #2f5a7d;text-align:center;background:#14466b;" class="email-divider">
      <p style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#8fa3bf;letter-spacing:0.28em;text-transform:uppercase;margin:0 0 10px;">est. 2026</p>
      <p class="email-header-title" style="font-family:Inter,sans-serif;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 6px;">El Radar</p>
      <p class="email-tagline" style="font-family:Inter,sans-serif;font-size:10px;color:#8fa3bf;letter-spacing:0.16em;text-transform:uppercase;margin:0 0 14px;">arquitectura · código · producto</p>
      <p class="email-header-name" style="font-family:Inter,sans-serif;font-size:12px;color:#22d3ee;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Silvano Puccini · Full Stack Dev</p>
    </div>

    <!-- CONTENT -->
    <div style="padding:24px;background:#14466b;">

      <!-- Eyebrow -->
      <p class="email-eyebrow" style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 20px;text-align:center;line-height:2;">
        <span style="color:#a78bfa;">El Radar</span>
        <span style="color:#5a7186;margin:0 8px;">·</span>
        <span style="color:#22d3ee;">Nuevo post</span>
        <span style="color:#5a7186;margin:0 8px;">·</span>
        <span style="color:#ffffff;">Nº ${e.issue}</span>
      </p>

      <!-- Post: cover + contenido, caja con borde redondo -->
      <div style="background:#10283f;border:1px solid #2f5a7d;border-radius:12px;overflow:hidden;">

        <!-- Cover -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${cat.text};">
          <tr>
            <td align="center" style="padding:28px 20px;">
              <p class="email-cover-keyword" style="font-family:Inter,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.06em;color:#050810;margin:0;line-height:1.5;word-wrap:break-word;overflow-wrap:break-word;word-break:break-word;">${keywordUpper}</p>
            </td>
          </tr>
        </table>

        <!-- Categoría + Nº -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#10283f;border-bottom:1px solid #2f5a7d;" class="email-divider">
          <tr>
            <td style="padding:14px 24px;">
              <span style="display:inline-block;background:${cat.text};color:#050810;border:1px solid ${cat.text};border-radius:20px;padding:4px 12px;font-family:Inter,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
                ${e.category}
              </span>
            </td>
            <td style="text-align:right;vertical-align:middle;padding:14px 24px;">
              <span style="font-family:Inter,sans-serif;font-size:10px;color:#8fa3bf;letter-spacing:0.12em;text-transform:uppercase;">
                Nº ${e.issue}
              </span>
            </td>
          </tr>
        </table>

        <!-- Título + excerpt + CTA -->
        <div style="padding:24px;background:#10283f;">
          <h2 style="font-family:Inter,sans-serif;font-size:19px;font-weight:700;color:#ffffff;line-height:1.3;margin:0 0 14px;">
            ${e.title}
          </h2>
          <p class="email-excerpt email-excerpt-${catKey}" style="font-family:Inter,sans-serif;font-size:14px;color:#d4e2f2;line-height:1.7;margin:0 0 18px;border-left:4px solid ${cat.text};padding-left:14px;">
            ${e.excerpt}
          </p>

          <!-- Meta + CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2f5a7d;padding-top:16px;margin-top:4px;" class="email-divider">
            <tr>
              <td style="padding-bottom:12px;">
                <span style="font-family:Inter,sans-serif;font-size:12px;color:#8fa3bf;">
                  ${e.readingTime} · ${e.date}
                </span>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;">
                <a href="${opts.postUrl}" style="display:block;font-family:Inter,sans-serif;font-size:13px;font-weight:700;color:#050810;text-decoration:none;background:#22d3ee;padding:12px 24px;border-radius:8px;text-align:center;">
                  Leer el post completo →
                </a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- FOOTER en caja gemela a la del post -->
    <div style="padding:0 24px 24px;background:#14466b;">
      <div style="background:#10283f;border:1px solid #2f5a7d;border-radius:12px;overflow:hidden;padding:20px 24px;text-align:center;">
      <p style="font-family:Inter,sans-serif;font-size:10px;color:#8fa3bf;margin:0 0 6px;line-height:1.6;">
        Recibís este email porque te suscribiste a <strong style="color:#22d3ee;white-space:nowrap;">El&nbsp;Radar</strong>.
      </p>
      <p style="font-family:Inter,sans-serif;font-size:10px;color:#8fa3bf;margin:0 0 14px;line-height:1.6;">
        Vas a recibir 1 o 2 posts por semana sobre performance, producto y automatización con IA.
      </p>
      <table cellpadding="0" cellspacing="0" align="center" width="100%" style="margin:0 auto 14px;max-width:320px;">
        <tr>
          <td align="center" style="padding:0 0 8px 0;">
            <a href="${SITE_URL}/es/blog" style="display:block;font-family:Inter,sans-serif;font-size:13px;font-weight:700;color:#050810;text-decoration:none;background:#22d3ee;padding:10px 24px;border-radius:8px;text-align:center;">Ver el blog →</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0;">
            <a href="https://www.linkedin.com/in/silvano-puccini/" style="display:block;font-family:Inter,sans-serif;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border:1px solid #5a7186;padding:10px 24px;border-radius:8px;text-align:center;background:#10283f;">Seguime en LinkedIn →</a>
          </td>
        </tr>
      </table>
      <p style="font-family:Inter,sans-serif;font-size:9px;color:#5a7186;margin:0 0 8px;">El Radar · silvanopuccini.dev</p>
      <p style="font-family:Inter,sans-serif;font-size:10px;margin:0;">
        <a href="${opts.unsubUrl}" style="color:#8fa3bf;text-decoration:underline;">Desuscribirse</a>
      </p>
      </div>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Sends the "new post" newsletter to all active subscribers and records it
 * in newsletters_sent. Shared by the manual /api/notify endpoint and the
 * Sunday publish cron, so both paths behave identically.
 */
export async function sendPostNewsletter(slug: string): Promise<SendPostNewsletterResult> {
  const allPosts = getAllBlogPosts();
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    return { ok: false, error: `Post "${slug}" no encontrado.`, status: 404 };
  }

  const issueNum = String(post.issue).padStart(2, '0');
  const issueLabel = `Nueva nota · Nº ${issueNum}`;
  const postUrl = `${SITE_URL}/es/blog/${slug}`;

  const { data: subscribers, error: dbError } = await getSupabaseAdmin()
    .from('subscribers')
    .select('email')
    .eq('status', 'active');

  if (dbError) {
    console.error('[sendPostNewsletter] Supabase error:', dbError);
    return { ok: false, error: 'Error al obtener suscriptores.', status: 500 };
  }

  if (!subscribers || subscribers.length === 0) {
    return { ok: true, sent: 0 };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const emails = subscribers.map((s) => ({
    from: 'Silvano Puccini <hola@silvanopuccini.dev>',
    to: s.email,
    subject: `El Radar · ${issueLabel} — ${post.title}`,
      html: buildEmail({
      title: post.title,
      excerpt: post.excerpt ?? '',
      category: post.category,
      issue: issueNum,
      readingTime: post.readingTime ?? '5 min',
      date: formatDate(post.date),
      postUrl,
      unsubUrl: (() => {
        const { token, exp } = generateUnsubToken(s.email);
        return `${SITE_URL}/unsubscribe?email=${encodeURIComponent(s.email)}&token=${token}&exp=${exp}`;
      })(),
      keyword: post.keyword ?? post.category,
    }),
  }));

  const { error: sendError } = await resend.batch.send(emails);

  if (sendError) {
    console.error('[sendPostNewsletter] Resend batch error:', sendError);
    return { ok: false, error: 'Error al enviar emails.', status: 500 };
  }

  await getSupabaseAdmin()
    .from('newsletters_sent')
    .insert({ title: post.title, slug, recipients_count: subscribers.length });

  return { ok: true, sent: subscribers.length };
}