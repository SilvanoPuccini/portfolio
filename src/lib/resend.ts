import { Resend } from 'resend';
import { generateUnsubToken } from '@/lib/unsub-token';

// ─── CRM email wrapper ────────────────────────────────────────────────────────
export async function sendCrmEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL
    ? `Silvano Puccini Dev <${process.env.RESEND_FROM_EMAIL}>`
    : 'Silvano Puccini Dev <onboarding@resend.dev>';

  await resend.emails.send({ from: FROM, to, subject, html });
}

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

// emailShell and radarLogo removed — not used

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
  // La página de baja exige email + token + exp: sin firmar, este link
  // devolvía "No encontramos ese email" a todo suscriptor nuevo que lo usara.
  const { token, exp } = generateUnsubToken(email);
  const unsubUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}&exp=${exp}`;

  const html = `<!DOCTYPE html>
<html lang="es">
 <head>
   <meta charset="utf-8"/>
   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
   <title>El Radar</title>
   <style>
     @media only screen and (max-width:480px) {
       body { background:#112137 !important; }
       .email-container { background:#161a2b !important; }
       .email-header { border-bottom:1px solid rgba(255,255,255,0.2) !important; }
       .email-footer { border-top:1px solid rgba(255,255,255,0.2) !important; }
     }
   </style>
 </head>
 <body style="margin:0;padding:40px 16px;background:#161a2b;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;">

   <div class="email-container" style="max-width:580px;width:100%;margin:0 auto;background:#112137;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">

    <!-- Top accent line -->
    <div style="height:2px;background:linear-gradient(90deg,transparent 0%,#00d4d4 50%,transparent 100%);"></div>

    <!-- HEADER — radar SVG + marca en texto (el SVG se ve donde el cliente lo permite; en Gmail queda el texto limpio) -->
    <div class="email-header" style="padding:32px;border-bottom:1px solid rgba(255,255,255,0.12);text-align:center;position:relative;">
      <svg width="220" height="110" viewBox="0 0 220 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;" aria-hidden="true">
        <g opacity="0.3">
          <circle cx="110" cy="55" r="24" stroke="#00d4d4" stroke-width="0.75" stroke-dasharray="4 4"/>
          <circle cx="110" cy="55" r="44" stroke="#00d4d4" stroke-width="0.5"/>
          <circle cx="110" cy="55" r="66" stroke="#00d4d4" stroke-width="0.5" stroke-dasharray="8 8"/>
          <circle cx="110" cy="55" r="90" stroke="#00d4d4" stroke-width="0.375"/>
          <line x1="110" y1="55" x2="173" y2="9" stroke="#00d4d4" stroke-width="1" opacity="0.5"/>
          <line x1="110" y1="55" x2="47" y2="101" stroke="#00d4d4" stroke-width="0.5" opacity="0.2"/>
        </g>
      </svg>
     <div style="position:relative;z-index:1;">
         <p style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.28em;text-transform:uppercase;margin:0 0 8px;">est. 2026</p>
         <p style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:#e2e8f0;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px;">El Radar</p>
         <p class="email-tagline" style="font-family:Inter,sans-serif;font-size:9px;color:#64748b;letter-spacing:0.16em;text-transform:uppercase;margin:0 0 12px;">arquitectura · código · producto</p>
         <p class="email-cyan" style="font-family:Inter,sans-serif;font-size:11px;color:#00d4d4;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Silvano Puccini · Full Stack Dev</p>
       </div>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">

       <p style="font-family:Inter,sans-serif;font-size:11px;color:#94a3b8;letter-spacing:0.16em;text-transform:uppercase;margin:0 0 10px;">Hola,</p>
       <h1 style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:#e2e8f0;line-height:1.3;margin:0 0 20px;letter-spacing:-0.01em;">Me alegra que estés acá.</h1>

       <!-- Te suscribiste a: El Radar — misma línea -->
       <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
         <tr>
           <td style="vertical-align:middle;">
             <span style="font-family:Inter,sans-serif;font-size:14px;color:#cbd5e1;line-height:1.7;">Te suscribiste a:</span>
           </td>
           <td style="vertical-align:middle;padding-left:8px;">
             <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:600;color:#e2e8f0;letter-spacing:0.28em;text-transform:uppercase;">El</span>
             <span style="font-family:Inter,sans-serif;font-size:15px;font-weight:700;color:#e2e8f0;letter-spacing:0.14em;text-transform:uppercase;margin-left:3px;">Radar</span>
           </td>
         </tr>
       </table>

       <p style="font-family:Inter,sans-serif;font-size:14px;color:#cbd5e1;line-height:1.7;margin:0 0 12px;">
         El blog de <strong style="color:#00d4d4;">Silvano Puccini</strong> — un espacio donde documento decisiones reales de desarrollo, sin relleno y sin tutoriales de introducción.
       </p>
       <p style="font-family:Inter,sans-serif;font-size:14px;color:#cbd5e1;line-height:1.7;margin:0 0 28px;">
         Vas a recibir <strong style="color:#00d4d4;">1–2 posts por semana</strong> sobre performance, producto y automatización con IA.
       </p>

       <!-- Lo que vas a encontrar -->
       <div style="border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden;margin-bottom:32px;">
         <div style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);">
           <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:600;color:#00d4d4;letter-spacing:0.14em;text-transform:uppercase;">Lo que vas a encontrar</span>
         </div>
         <div style="padding:16px 20px;">
           <p style="font-family:Inter,sans-serif;font-size:14px;color:#cbd5e1;margin:0 0 8px;">→ Performance real — Web Vitals, optimización y arquitectura</p>
           <p style="font-family:Inter,sans-serif;font-size:14px;color:#cbd5e1;margin:0 0 8px;">→ Producto — qué funciona, qué no, y por qué</p>
           <p style="font-family:Inter,sans-serif;font-size:14px;color:#cbd5e1;margin:0;">→ Automatización con IA — herramientas en proyectos reales</p>
         </div>
       </div>

       <!-- CTAs -->
       <table cellpadding="0" cellspacing="0" class="email-footer-buttons">
         <tr>
           <td class="email-footer-btn-cell" style="padding-bottom:12px;">
             <a href="${SITE_URL}/es/blog" class="email-footer-btn" style="display:inline-block;background:#00d4d4;color:#050810;font-family:Inter,sans-serif;font-size:14px;font-weight:700;padding:13px 26px;border-radius:8px;text-decoration:none;letter-spacing:0.04em;white-space:nowrap;">Ver el blog →</a>
           </td>
         </tr>
         <tr>
           <td class="email-footer-btn-cell">
             <a href="https://www.linkedin.com/in/silvano-puccini/" class="email-footer-btn" style="display:inline-block;background:transparent;color:#94a3b8;font-family:Inter,sans-serif;font-size:13px;font-weight:600;padding:13px 26px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);white-space:nowrap;">Seguime en LinkedIn →</a>
           </td>
         </tr>
       </table>

    </div>

    <!-- Footer -->
    <div class="email-footer" style="padding:16px 20px 20px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0 0 4px;line-height:1.6;white-space:nowrap;">Recibís este email porque te suscribiste a El Radar.</p>
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
