import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAllBlogPosts } from '@/lib/mdx';
import { CATEGORY_COLOR } from '@/lib/resend';
import { TECH_ICONS, VERSUS_PATTERN } from '@/components/blog/tech-icons';
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function buildEmail(opts: {
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

  // Cover del post en HTML puro (traducción email-safe de PostCover):
  // sin radial-gradient ni SVG porque Gmail los elimina. Solo color sólido
  // de categoría + keyword centrado. Sale siempre del slug, sin imágenes.
  const keywordUpper = e.keyword.toUpperCase();
  let coverKeyword: string;
  if (e.keyword === 'El Radar') {
    coverKeyword = `
      <p style="font-family:monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 6px;">El</p>
      <p style="font-family:'Space Grotesk',sans-serif;font-size:30px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:0;line-height:1;">Radar</p>
      <p style="font-family:monospace;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:8px 0 0;">arquitectura · código · producto</p>`;
  } else if (VERSUS_PATTERN.test(e.keyword)) {
    coverKeyword = `
      <p style="font-family:monospace;font-size:15px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin:0;line-height:1.8;">${keywordUpper}</p>`;
  } else {
    const techColor = TECH_ICONS[e.keyword]?.color;
    const color = techColor ?? 'rgba(255,255,255,0.45)';
    const size = techColor ? '20px' : '15px';
    const weight = techColor ? '600' : '400';
    coverKeyword = `
      <p style="font-family:'Space Grotesk',sans-serif;font-size:${size};font-weight:${weight};letter-spacing:0.12em;text-transform:uppercase;color:${color};margin:0;line-height:1.5;">${keywordUpper}</p>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>El Radar · Nº ${e.issue} · ${e.title}</title>
  <style>
    @media only screen and (max-width:480px) {
      .email-content { padding-left:20px !important; padding-right:20px !important; }
      .email-btn-cell { display:block !important; width:100% !important; padding:0 0 12px 0 !important; }
      .email-btn { display:block !important; text-align:center !important; }
      .email-eyebrow { font-size:10px !important; letter-spacing:0.1em !important; }
    }
  </style>
</head>
<body style="margin:0;padding:40px 16px;background:#050810;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:600px;width:100%;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">

    <!-- HEADER — marca en texto (cero imágenes: Gmail les pone botón de descarga) -->
    <div style="padding:28px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;background:#0b1120;">
      <p style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.32em;text-transform:uppercase;margin:0 0 8px;">El Radar</p>
      <p style="font-family:'Space Grotesk',sans-serif;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 6px;">Silvano Puccini · Full Stack Dev</p>
      <p style="font-family:monospace;font-size:7px;color:#8c909f;letter-spacing:0.2em;text-transform:uppercase;margin:0;">ARQUITECTURA · CÓDIGO · PRODUCTO</p>
    </div>

    <!-- CONTENT -->
    <div class="email-content" style="padding:28px 32px 32px;">

      <!-- Centro: EL RADAR · NUEVO POST · Nº XX -->
      <p class="email-eyebrow" style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 24px;text-align:center;line-height:2;">
        <span style="color:#94a3b8;">El Radar</span>
        <span style="color:rgba(255,255,255,0.2);margin:0 6px;">·</span>
        <span style="color:#00d4d4;">Nuevo post</span>
        <span style="color:rgba(255,255,255,0.2);margin:0 6px;">·</span>
        <span style="color:#ffffff;">Nº ${e.issue}</span>
      </p>

      <!-- Card del post -->
      <div style="border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;">

        <!-- Cover del post en HTML: header de la card, sale del slug -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b12;border-top:3px solid ${cat.text};">
          <tr>
            <td align="center" style="padding:36px 24px 32px;text-align:center;">
              ${coverKeyword}
            </td>
          </tr>
        </table>

        <!-- Card header: categoría + número -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
          <tr>
            <td>
              <span style="display:inline-block;background:${cat.bg};color:${cat.text};border:1px solid ${cat.border};border-radius:20px;padding:4px 12px;font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">
                ${e.category}
              </span>
            </td>
            <td style="text-align:right;">
              <span style="font-family:'Space Grotesk',sans-serif;font-size:10px;color:#8c909f;letter-spacing:0.14em;text-transform:uppercase;">
                Nº ${e.issue}
              </span>
            </td>
          </tr>
        </table>

        <!-- Card body -->
        <div style="padding:28px 24px 24px;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;margin:0 0 16px;letter-spacing:-0.01em;">
            ${e.title}
          </h2>
          <p style="font-size:14px;color:rgba(221,226,248,0.8);line-height:1.7;margin:0 0 20px;border-left:2px solid ${cat.text};padding-left:14px;">
            ${e.excerpt}
          </p>

          <!-- Meta + CTA largo -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-top:4px;">
            <tr>
              <td style="vertical-align:middle;">
                <span style="font-family:'Space Grotesk',sans-serif;font-size:13px;color:#8c909f;letter-spacing:0.06em;">
                  ${e.readingTime} · ${e.date}
                </span>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <a href="${opts.postUrl}" style="display:inline-block;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#050810;text-decoration:none;letter-spacing:0.04em;background:#00d4d4;padding:12px 24px;border-radius:8px;">
                  Leer el post completo →
                </a>
              </td>
            </tr>
          </table>
        </div>

      </div>

    </div>

    <!-- FOOTER -->
    <div style="padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0 0 8px;line-height:1.6;">
        Recibís este email porque te suscribiste a <strong style="color:#00d4d4;">El Radar</strong>.
      </p>
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0 0 16px;line-height:1.6;">
        Vas a recibir 1 o 2 posts por semana sobre performance, producto y automatización con IA.
      </p>
      <!-- Botones con tabla apilable (flex no lo soporta Gmail; en mobile van uno abajo del otro) -->
      <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px;">
        <tr>
          <td class="email-btn-cell" style="padding:0 8px 0 0;">
            <a href="${SITE_URL}/es/blog" class="email-btn" style="display:inline-block;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#050810;text-decoration:none;background:#00d4d4;padding:12px 28px;border-radius:8px;letter-spacing:0.04em;white-space:nowrap;">Ver el blog →</a>
          </td>
          <td class="email-btn-cell" style="padding:0 0 0 8px;">
            <a href="https://www.linkedin.com/in/silvano-puccini/" class="email-btn" style="display:inline-block;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:500;color:rgba(221,226,248,0.8);text-decoration:none;border:1px solid rgba(255,255,255,0.25);padding:12px 28px;border-radius:8px;white-space:nowrap;">Seguime en LinkedIn →</a>
          </td>
        </tr>
      </table>
      <p style="font-size:10px;color:#475569;margin:0 0 12px;font-family:monospace;letter-spacing:0.05em;">El Radar · silvanopuccini.dev</p>
      <p style="font-size:11px;margin:0;line-height:1.6;">
        <a href="${opts.unsubUrl}" style="color:rgba(140,144,159,0.5);text-decoration:underline;">Desuscribirse</a>
      </p>
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