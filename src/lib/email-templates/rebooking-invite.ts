import { escapeHtml } from '@/lib/html-escape';

/**
 * La invitación a reagendar, después de un no-show.
 *
 * Que alguien no aparezca a una llamada casi nunca significa que perdió el
 * interés: se le cruzó algo y le da vergüenza escribir. Por eso este correo no
 * reprocha ni pide explicaciones — le devuelve el link y le saca el peso de
 * tener que dar el primer paso.
 *
 * Un no-show sin reagendar es plata parada, no un callejón sin salida.
 */

export interface RebookingData {
  name: string;
  /** El link de reserva. Sale de NEXT_PUBLIC_CALCOM_LINK. */
  bookingUrl: string;
}

export function rebookingInviteHtml(data: RebookingData): string {

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>¿Buscamos otro horario?</title>
</head>
<body style="margin:0;padding:32px 16px;background:#050810;font-family:'Inter',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <div style="height:2px;background:linear-gradient(90deg,transparent,#00d4d4,transparent);"></div>
    <div style="padding:32px;">
      <p style="font-family:monospace;font-size:10px;color:#00d4d4;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 16px;">Silvano Puccini Dev</p>
      <h1 style="font-size:20px;font-weight:700;color:#f0f0f0;margin:0 0 16px;">
        Hola, ${escapeHtml(data.name)}
      </h1>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 12px;">
        No pudimos hacer la llamada. Sin problema — se cruzan cosas.
      </p>
      <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">
        Si seguís interesado, elegí el horario que mejor te quede y lo retomamos donde estábamos.
      </p>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${escapeHtml(data.bookingUrl)}"
           style="display:inline-block;background:#00d4d4;color:#05070f;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:8px;">
          Elegir un horario
        </a>
      </div>

      <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">
        Y si ya no es el momento, respondeme una línea y listo — no te escribo más.
        Respondé este correo si preferís coordinar por acá.
      </p>
    </div>
    <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:rgba(140,144,159,0.5);margin:0;">Silvano Puccini · silvanopuccini.dev</p>
    </div>
  </div>
</body>
</html>`;
}
