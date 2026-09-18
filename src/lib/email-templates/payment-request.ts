import { escapeHtml } from '@/lib/html-escape';

/**
 * El pedido de pago, después de la firma.
 *
 * Va después del contrato firmado y no antes, a propósito. El contrato es lo
 * que protege a las dos partes: cobrar sin él deja una venta sin respaldo
 * escrito. Y para el cliente firmar no cuesta plata, así que hay mucha menos
 * fricción en «firmá esto» que en «pagá esto»; una vez que firmó ya decidió, y
 * el pago pasa a ser el trámite.
 *
 * Por eso este correo no vende nada: confirma lo ya acordado y dice cómo pagar.
 */

export interface PaymentRequestData {
  name: string;
  /** Lo que hay que pagar ahora. */
  amount: number;
  /** El total del proyecto, para que el número de arriba tenga contexto. */
  total: number;
  /** Porcentaje de seña acordado, o 100 si es pago único. */
  pct: number;
  singlePayment: boolean;
  /** Cómo pagar: alias, CBU, link. Sale de la configuración del panel. */
  paymentInstructions: string;
}

const money = (value: number) => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export function paymentRequestHtml(data: PaymentRequestData): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';

  const detail = data.singlePayment
    ? `Pago único por el total del proyecto.`
    : `Seña del ${data.pct}% sobre ${money(data.total)}. El ${100 - data.pct}% restante se abona contra entrega.`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Datos para el pago</title>
</head>
<body style="margin:0;padding:32px 16px;background:#050810;font-family:'Inter',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,#00d4d4,transparent);"></div>
    <div style="padding:32px;">
      <p style="font-family:monospace;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 16px;">Silvano Puccini Dev</p>
      <h1 style="font-size:20px;font-weight:700;color:#f0f0f0;margin:0 0 16px;">
        Gracias por firmar, ${escapeHtml(data.name)}
      </h1>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">
        Con el contrato firmado, el último paso para arrancar es el pago inicial.
      </p>

      <div style="border:1px solid rgba(0,212,212,0.24);border-radius:8px;padding:20px;background:rgba(0,212,212,0.04);margin-bottom:24px;">
        <p style="font-size:11px;color:#64748b;margin:0 0 6px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">A abonar ahora</p>
        <p style="font-size:30px;color:#00d4d4;margin:0 0 10px;font-weight:700;">${money(data.amount)}</p>
        <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">${escapeHtml(detail)}</p>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-bottom:24px;">
        <p style="font-size:11px;color:#64748b;margin:0 0 8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">Cómo pagar</p>
        <p style="font-size:14px;color:#f0f0f0;margin:0;line-height:1.7;white-space:pre-wrap;">${escapeHtml(data.paymentInstructions)}</p>
      </div>

      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">
        Apenas se acredite te mando la factura y arrancamos. Si preferís otra forma de pago, avisame y lo vemos.
      </p>

      <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">
        Ante cualquier duda, respondé este email o escribime desde <a href="${siteUrl}" style="color:#00d4d4;text-decoration:none;">${siteUrl}</a>
      </p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0;">Silvano Puccini · silvanopuccini.dev</p>
    </div>
  </div>
</body>
</html>`;
}
