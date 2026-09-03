import { escapeHtml } from '@/lib/html-escape';

type LeadContact = {
  name: string;
  email: string;
};

export function questionnaireInviteHtml(lead: LeadContact, url: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cuestionario de proyecto</title>
</head>
<body style="margin:0;padding:32px 16px;background:#050810;font-family:'Inter',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,#00d4d4,transparent);"></div>
    <div style="padding:32px;">
      <p style="font-family:monospace;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 16px;">Silvano Puccini Dev</p>
      <h1 style="font-size:20px;font-weight:700;color:#f0f0f0;margin:0 0 16px;">
        Hola, ${escapeHtml(lead.name)}
      </h1>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 20px;">
        Para entender mejor tu proyecto y preparar una propuesta precisa, te pido que completes un breve cuestionario. Son 6 preguntas y no toma más de 5 minutos.
      </p>
      <div style="margin:28px 0;text-align:center;">
        <a href="${url}" style="display:inline-block;background:#00d4d4;color:#050810;font-size:15px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;">
          Completar cuestionario →
        </a>
      </div>
      <p style="font-size:12px;color:#475569;line-height:1.6;margin:0;">
        Si el botón no funciona, copiá este enlace en tu navegador:<br/>
        <a href="${url}" style="color:#00d4d4;word-break:break-all;">${url}</a>
      </p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0;">Silvano Puccini · silvanopuccini.dev</p>
    </div>
  </div>
</body>
</html>`;
}
