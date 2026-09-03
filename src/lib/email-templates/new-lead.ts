import { escapeHtml } from '@/lib/html-escape';

type NewLeadData = {
  name: string;
  email: string;
  service: string | null;
  project_type: string | null;
  created_at: string;
};

export function newLeadHtml(lead: NewLeadData): string {
  // Todo esto llega de un formulario público: se escapa antes de interpolar.
  const e = {
    name: escapeHtml(lead.name),
    email: escapeHtml(lead.email),
    service: escapeHtml(lead.service ?? '—'),
    projectType: escapeHtml(lead.project_type ?? '—'),
  };

  const submittedAt = new Date(lead.created_at).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nuevo lead</title>
</head>
<body style="margin:0;padding:32px 16px;background:#050810;font-family:'Inter',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,#00d4d4,transparent);"></div>
    <div style="padding:28px 32px;">
      <p style="font-family:monospace;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 16px;">Nuevo lead recibido</p>
      <h1 style="font-size:20px;font-weight:700;color:#f0f0f0;margin:0 0 20px;">
        ${e.name}
      </h1>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;width:130px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-size:14px;color:#e2e8f0;">${e.email}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Servicio</td>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-size:14px;color:#e2e8f0;">${e.service}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-size:12px;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Tipo</td>
          <td style="padding:10px 0;border-bottom:1px solid #1e293b;font-size:14px;color:#e2e8f0;">${e.projectType}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:12px;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Enviado</td>
          <td style="padding:10px 0;font-size:14px;color:#e2e8f0;">${submittedAt}</td>
        </tr>
      </table>
      <div style="margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev'}/admin/leads" style="display:inline-block;background:#00d4d4;color:#050810;font-size:14px;font-weight:700;padding:11px 22px;border-radius:8px;text-decoration:none;">Ver en admin →</a>
      </div>
    </div>
    <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0;">silvanopuccini.dev · CRM Admin</p>
    </div>
  </div>
</body>
</html>`;
}
