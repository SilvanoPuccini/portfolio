import { escapeHtml } from '@/lib/html-escape';

/**
 * El correo de después del pago.
 *
 * Es el momento de mayor ansiedad del cliente: acaba de soltar plata y todavía
 * no vio nada. Por eso este correo no se limita a decir «recibido» — cuenta qué
 * pasa ahora, con fechas, y cuándo va a tener noticias. Es el mail más barato
 * de escribir y el que más tranquilidad compra.
 *
 * La factura viaja adjunta cuando existe. Mientras la facturación se emita
 * afuera, el correo igual sale: es peor dejar al cliente sin respuesta que
 * mandarle el agradecimiento sin el comprobante.
 */

export interface PaymentReceivedData {
  name: string;
  amount: number;
  /** Número de factura, si ya se emitió. */
  invoiceNumber?: string | null;
  /** Qué pasa ahora, en orden. Cada línea es un paso. */
  nextSteps: string[];
  /** Cuándo tiene la primera novedad concreta. */
  firstUpdate: string;
}

const money = (value: number) => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export function paymentReceivedHtml(data: PaymentReceivedData): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';

  const steps = data.nextSteps.map((step, index) => `
        <div style="display:flex;gap:12px;margin-bottom:14px;">
          <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(0,212,212,0.12);color:#00d4d4;font-family:monospace;font-size:11px;font-weight:700;text-align:center;line-height:22px;">${index + 1}</span>
          <span style="font-size:14px;color:#94a3b8;line-height:1.6;">${escapeHtml(step)}</span>
        </div>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pago recibido — arrancamos</title>
</head>
<body style="margin:0;padding:32px 16px;background:#050810;font-family:'Inter',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,#4ade80,transparent);"></div>
    <div style="padding:32px;">
      <p style="font-family:monospace;font-size:10px;color:#4ade80;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 16px;">Pago recibido</p>
      <h1 style="font-size:20px;font-weight:700;color:#f0f0f0;margin:0 0 16px;">
        Gracias, ${escapeHtml(data.name)}. Arrancamos.
      </h1>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">
        Confirmo la acreditación de ${money(data.amount)}${data.invoiceNumber ? ` y te dejo la factura ${escapeHtml(data.invoiceNumber)} adjunta` : ''}.
      </p>

      <div style="border:1px solid rgba(74,222,128,0.2);border-radius:8px;padding:20px;background:rgba(74,222,128,0.04);margin-bottom:24px;">
        <p style="font-size:11px;color:#64748b;margin:0 0 16px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Qué pasa ahora</p>
        ${steps}
      </div>

      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">
        <strong style="color:#f0f0f0;">Tu primera novedad:</strong> ${escapeHtml(data.firstUpdate)}.
        No hace falta que hagas nada hasta entonces.
      </p>

      <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">
        Si en el medio surge cualquier cosa, respondé este email — lo leo yo.
        También estoy en <a href="${siteUrl}" style="color:#00d4d4;text-decoration:none;">${siteUrl}</a>
      </p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0;">Silvano Puccini · silvanopuccini.dev</p>
    </div>
  </div>
</body>
</html>`;
}
