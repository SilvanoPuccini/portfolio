import { escapeHtml } from '@/lib/html-escape';

/**
 * El contrato listo para firmar, con el link a nuestra página.
 *
 * Sale de nuestro dominio y con nuestro diseño. Antes lo mandaba Documenso,
 * con su marca y su dirección de San Francisco al pie: el cliente recibía un
 * correo de un tercero justo en el momento más importante de la venta.
 *
 * Es un respaldo, no el camino principal: el cliente firma en la página, sin
 * salir de ella. Este correo existe para el que cerró la pestaña antes.
 */

export interface ContractToSign {
  name: string;
  /** Qué compró, para que el correo se entienda sin abrir nada. */
  paquete: string;
  totalUsd: number;
  /** La página del pedido, donde está el contrato. */
  url: string;
}

export function contractToSignHtml(data: ContractToSign): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
  const total = `USD ${Math.round(data.totalUsd).toLocaleString('es-AR')}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tu contrato está listo para firmar</title>
</head>
<body style="margin:0;padding:32px 16px;background:#050810;font-family:'Inter',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,#00d4d4,transparent);"></div>
    <div style="padding:32px;">
      <p style="font-family:monospace;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 16px;">Silvano Puccini Dev</p>
      <h1 style="font-size:20px;font-weight:700;color:#f0f0f0;margin:0 0 16px;">
        Hola, ${escapeHtml(data.name)}
      </h1>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 20px;">
        Tu contrato está listo y ya viene firmado de mi parte. Solo falta tu firma.
      </p>

      <div style="border:1px solid rgba(0,212,212,0.2);border-radius:8px;padding:16px 20px;background:rgba(0,212,212,0.04);margin-bottom:24px;">
        <p style="font-size:12px;color:#64748b;margin:0 0 4px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Tu pedido</p>
        <p style="font-size:15px;color:#f0f0f0;margin:0 0 2px;font-weight:600;">${escapeHtml(data.paquete)}</p>
        <p style="font-size:14px;color:#00d4d4;margin:0;font-family:monospace;">${total}</p>
      </div>

      <a href="${escapeHtml(data.url)}" style="display:inline-block;background:#00d4d4;color:#050810;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;">
        Ver y firmar el contrato
      </a>

      <p style="font-size:13px;color:#475569;line-height:1.6;margin:24px 0 0;">
        Firmar no dispara ningún cobro: los datos para pagar te llegan después, en otro correo.
      </p>
      <p style="font-size:13px;color:#475569;line-height:1.6;margin:12px 0 0;">
        Si algo del contrato no te cierra, respondé este correo antes de firmar y lo vemos.
      </p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0;">Silvano Puccini · ${siteUrl.replace('https://', '')}</p>
    </div>
  </div>
</body>
</html>`;
}
