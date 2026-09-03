import { escapeHtml } from '@/lib/html-escape';

type LeadContact = {
  name: string;
  email: string;
};

export function proposalReadyHtml(lead: LeadContact): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tu propuesta está lista</title>
</head>
<body style="margin:0;padding:32px 16px;background:#050810;font-family:'Inter',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,#00d4d4,transparent);"></div>
    <div style="padding:32px;">
      <p style="font-family:monospace;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 16px;">Silvano Puccini Dev</p>
      <h1 style="font-size:20px;font-weight:700;color:#f0f0f0;margin:0 0 16px;">
        Hola, ${escapeHtml(lead.name)}
      </h1>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 12px;">
        Preparé tu propuesta con el detalle completo del proyecto, los módulos incluidos, el timeline estimado y la inversión.
      </p>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">
        Leéla cuando tengas un momento y avisame si querés ajustar algo antes de avanzar.
      </p>
      <div style="border:1px solid rgba(0,212,212,0.2);border-radius:8px;padding:16px 20px;background:rgba(0,212,212,0.04);margin-bottom:24px;">
        <p style="font-size:12px;color:#64748b;margin:0 0 4px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Adjunto</p>
        <p style="font-size:14px;color:#00d4d4;margin:0;font-weight:600;">Propuesta — ${escapeHtml(lead.name)}.docx</p>
      </div>
      <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">
        Ante cualquier duda, respondé este email o contactame en <a href="${siteUrl}" style="color:#00d4d4;text-decoration:none;">${siteUrl}</a>
      </p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0;">Silvano Puccini · silvanopuccini.dev</p>
    </div>
  </div>
</body>
</html>`;
}
