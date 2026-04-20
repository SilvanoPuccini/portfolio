import { Resend } from 'resend';

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg:         '#0a0a14',
  surface:    '#0f0f1a',
  surfaceDim: '#111120',
  border:     '#1e293b',
  borderSub:  '#1a1a2a',
  textPrimary:   '#f0f0f0',
  textSecondary: '#94a3b8',
  textTertiary:  '#475569',
  textDim:       '#888',
  brand:      '#00d4d4',
  brandDark:  '#0a0a12',
};

// ─── Category colors ─────────────────────────────────────────────────────────
export const CATEGORY_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Performance:   { bg: 'rgba(74,222,128,0.08)',  text: '#4ade80', border: 'rgba(74,222,128,0.2)' },
  Producto:      { bg: 'rgba(192,132,252,0.08)', text: '#c084fc', border: 'rgba(192,132,252,0.2)' },
  Automatización:{ bg: 'rgba(251,191,36,0.08)',  text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  Criterio:      { bg: 'rgba(129,140,248,0.08)', text: '#818cf8', border: 'rgba(129,140,248,0.2)' },
  Editorial:     { bg: 'rgba(34,211,238,0.08)',  text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
};

const defaultCat = { bg: 'rgba(0,212,212,0.08)', text: '#00d4d4', border: 'rgba(0,212,212,0.2)' };

// ─── Shared shell ─────────────────────────────────────────────────────────────
function emailShell(body: string, unsubscribeUrl?: string): string {
  const footer = unsubscribeUrl
    ? `<p style="font-size:11px;font-family:monospace;color:${T.textTertiary};margin:0;">
        Recibís este email porque te suscribiste a El Radar.&nbsp;·&nbsp;
        <a href="${unsubscribeUrl}" style="color:${T.textTertiary};text-decoration:underline;">Desuscribirse</a>
       </p>`
    : `<p style="font-size:11px;font-family:monospace;color:${T.textTertiary};margin:0;">Silvano Puccini · Full Stack Dev</p>`;

  return `
<div style="max-width:580px;margin:0 auto;font-family:sans-serif;background:${T.bg};border-radius:12px;overflow:hidden;border:1px solid ${T.border};">
  <div style="padding:20px 32px;border-bottom:1px solid ${T.borderSub};">
    <span style="font-family:monospace;font-size:11px;color:${T.brand};letter-spacing:0.14em;text-transform:uppercase;">Silvano Puccini · Full Stack Dev</span>
  </div>
  <div style="padding:32px;">
    ${body}
  </div>
  <div style="padding:16px 32px;border-top:1px solid ${T.borderSub};">
    ${footer}
  </div>
</div>`;
}

// ─── El Radar logo block ──────────────────────────────────────────────────────
function radarLogo(): string {
  return `
<div style="text-align:center;margin:24px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
    <tr>
      <td style="border-bottom:1px solid #333;width:40%;"></td>
      <td style="white-space:nowrap;padding:0 8px;font-family:monospace;font-size:8px;color:#666;letter-spacing:0.22em;text-transform:uppercase;">est. 2026</td>
      <td style="border-bottom:1px solid #333;width:40%;"></td>
    </tr>
  </table>
  <p style="font-family:sans-serif;font-size:10px;font-weight:600;color:#999;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 2px;">El</p>
  <p style="font-family:sans-serif;font-size:20px;font-weight:700;color:${T.textDim};letter-spacing:0.14em;text-transform:uppercase;margin:0 0 4px;">Radar</p>
  <p style="font-family:monospace;font-size:8px;color:#555;letter-spacing:0.18em;text-transform:uppercase;margin:0;">arquitectura · código · producto</p>
</div>`;
}

// ─── Post card block ──────────────────────────────────────────────────────────
export function postCardHtml(opts: {
  title: string;
  excerpt: string;
  category: string;
  issue: string;
  readingTime: string;
  date: string;
  postUrl: string;
  keyword?: string;
}): string {
  const cat = CATEGORY_COLOR[opts.category] ?? defaultCat;

  return `
<div style="border:1px solid ${T.border};border-radius:10px;overflow:hidden;margin:24px 0;">
  <!-- Cover -->
  <div style="background:linear-gradient(145deg,#0d0d1f 0%,#12121e 50%,#0a0a18 100%);padding:28px 24px;text-align:center;border-bottom:1px solid ${T.border};position:relative;">
    <div style="display:inline-block;border-left:2px solid ${cat.text};padding-left:12px;">
      <span style="font-family:monospace;font-size:11px;color:${cat.text};letter-spacing:0.18em;text-transform:uppercase;">${opts.keyword ?? opts.category}</span>
    </div>
  </div>
  <!-- Content -->
  <div style="padding:20px 24px;background:${T.surface};">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td>
          <span style="display:inline-block;background:${cat.bg};color:${cat.text};border:1px solid ${cat.border};border-radius:20px;padding:3px 10px;font-family:monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">${opts.category}</span>
        </td>
        <td style="text-align:right;">
          <span style="font-family:monospace;font-size:10px;color:${T.textTertiary};letter-spacing:0.14em;text-transform:uppercase;">Nº ${opts.issue}</span>
        </td>
      </tr>
    </table>
    <h2 style="font-size:18px;font-weight:700;color:${T.textPrimary};margin:0 0 10px;line-height:1.35;">${opts.title}</h2>
    <p style="font-size:13px;color:${T.textSecondary};line-height:1.65;margin:0 0 16px;">${opts.excerpt}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${T.border};padding-top:14px;margin-top:4px;">
      <tr>
        <td>
          <span style="font-family:monospace;font-size:10px;color:${T.textTertiary};text-transform:uppercase;letter-spacing:0.12em;">${opts.readingTime}</span>
          <span style="font-family:monospace;font-size:10px;color:#2a2a3a;margin:0 6px;">·</span>
          <span style="font-family:monospace;font-size:10px;color:${T.textTertiary};text-transform:uppercase;letter-spacing:0.12em;">${opts.date}</span>
        </td>
        <td style="text-align:right;">
          <a href="${opts.postUrl}" style="font-family:monospace;font-size:10px;color:${T.brand};text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Leer más →</a>
        </td>
      </tr>
    </table>
  </div>
</div>`;
}

// ─── Welcome email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL
    ? `El Radar <${process.env.RESEND_FROM_EMAIL}>`
    : 'El Radar <onboarding@resend.dev>';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
  const unsubUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>El Radar</title>
</head>
<body style="margin:0;padding:40px 16px;background:#050810;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:580px;width:100%;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">

    <!-- Top accent line -->
    <div style="height:2px;background:linear-gradient(90deg,transparent 0%,#00d4d4 50%,transparent 100%);"></div>

    <!-- Header — logo El Radar -->
    <div style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:bottom;padding-bottom:3px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:0.32em;text-transform:uppercase;">El</span>
          </td>
          <td style="vertical-align:bottom;padding-left:6px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#94a3b8;letter-spacing:0.14em;text-transform:uppercase;">Radar</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">

      <p style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;color:#8c909f;letter-spacing:0.16em;text-transform:uppercase;margin:0 0 10px;">Hola,</p>
      <h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;margin:0 0 20px;letter-spacing:-0.01em;">Me alegra que estés acá.</h1>

      <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;color:rgba(221,226,248,0.8);line-height:1.7;margin:0 0 16px;">Te suscribiste a:</p>

      <!-- El Radar inline -->
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="vertical-align:bottom;padding-bottom:2px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.32em;text-transform:uppercase;">El</span>
          </td>
          <td style="vertical-align:bottom;padding-left:5px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#94a3b8;letter-spacing:0.14em;text-transform:uppercase;">Radar</span>
          </td>
        </tr>
      </table>

      <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;color:rgba(221,226,248,0.8);line-height:1.7;margin:0 0 12px;">
        El blog de <strong style="color:#00d4d4;">Silvano Puccini</strong> — un espacio donde documento decisiones reales de desarrollo, sin relleno y sin tutoriales de introducción.
      </p>
      <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;color:rgba(221,226,248,0.8);line-height:1.7;margin:0 0 28px;">
        Vas a recibir <strong style="color:#00d4d4;">1–2 posts por semana</strong> sobre performance, producto y automatización con IA.
      </p>

      <!-- Lo que vas a encontrar -->
      <div style="border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden;margin-bottom:32px;">
        <div style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
          <span style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:600;color:#00d4d4;letter-spacing:0.14em;text-transform:uppercase;">Lo que vas a encontrar</span>
        </div>
        <div style="padding:16px 20px;">
          <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;color:rgba(221,226,248,0.8);margin:0 0 8px;">→ Performance real — Web Vitals, optimización y arquitectura</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;color:rgba(221,226,248,0.8);margin:0 0 8px;">→ Producto — qué funciona, qué no, y por qué</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:14px;color:rgba(221,226,248,0.8);margin:0;">→ Automatización con IA — herramientas en proyectos reales</p>
        </div>
      </div>

      <!-- CTAs -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:12px;">
            <a href="${SITE_URL}/es/blog" style="display:inline-block;background:#00d4d4;color:#050810;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;padding:13px 26px;border-radius:8px;text-decoration:none;letter-spacing:0.04em;">Ver el blog →</a>
          </td>
        </tr>
        <tr>
          <td>
            <a href="https://www.linkedin.com/in/silvano-puccini/" style="display:inline-block;background:transparent;color:rgba(221,226,248,0.8);font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:500;padding:13px 26px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.07);">Seguime en LinkedIn →</a>
          </td>
        </tr>
      </table>

    </div>

    <!-- Footer -->
    <div style="padding:20px 32px 24px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0 0 4px;line-height:1.8;">Recibís este email porque te suscribiste a El Radar</p>
      <a href="${unsubUrl}" style="font-size:11px;color:rgba(140,144,159,0.5);text-decoration:underline;">Desuscribirse</a>
    </div>

  </div>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenido a El Radar',
    html,
  });
}
