import { escapeHtml } from '@/lib/html-escape';

/**
 * La base visual de todos los correos del circuito de venta.
 *
 * Antes cada plantilla traía sus propios estilos escritos a mano: los tres
 * correos que recibe un cliente se veían distintos entre sí, y arreglar un
 * color había que hacerlo en cada archivo.
 *
 * Todo va en tablas y con estilos en línea a propósito: es lo único que
 * respetan Outlook y Gmail. Flexbox y grid se ven bien en el navegador y se
 * rompen en el correo, que es donde esto importa.
 */

const COLOR = {
  fondo: '#050810',
  panel: '#0b1120',
  borde: 'rgba(255,255,255,0.07)',
  marca: '#00d4d4',
  titulo: '#f0f0f0',
  texto: '#94a3b8',
  tenue: '#64748b',
} as const;

const FUENTE = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,monospace";

export interface EmailLayout {
  /** El título de la pestaña y el preview que muestra la bandeja. */
  preheader: string;
  eyebrow: string;
  titulo: string;
  /** El cuerpo, ya armado con los bloques de abajo. */
  cuerpo: string;
  /** En qué paso del circuito está, para que se ubique sin leer. */
  paso?: 1 | 2 | 3;
}

const PASOS = ['Firmar', 'Pagar', 'Arrancar'] as const;

/** La cinta de pasos: dónde está y qué falta, de un vistazo. */
function cintaDePasos(actual: number): string {
  const celdas = PASOS.map((nombre, i) => {
    const paso = i + 1;
    const hecho = paso < actual;
    const aqui = paso === actual;
    const color = hecho ? COLOR.marca : aqui ? COLOR.titulo : COLOR.tenue;
    const punto = hecho ? COLOR.marca : aqui ? COLOR.marca : 'rgba(100,116,139,0.45)';

    return `<td style="padding:0 14px 0 0;white-space:nowrap;">
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${punto};margin-right:7px;"></span>
      <span style="font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${color};">${nombre}</span>
    </td>`;
  }).join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;">
    <tr>${celdas}</tr>
  </table>`;
}

/** Un párrafo del cuerpo. El texto entra escapado: nunca se confía en él. */
export function parrafo(texto: string): string {
  return `<p style="font-family:${FUENTE};font-size:14px;color:${COLOR.texto};line-height:1.7;margin:0 0 14px;">${escapeHtml(texto)}</p>`;
}

/** El dato que importa: el monto, el paquete, lo que sea que se mira primero. */
export function panelDestacado(opciones: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  nota?: string;
}): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 22px;">
    <tr><td style="border:1px solid rgba(0,212,212,0.22);border-radius:10px;background:rgba(0,212,212,0.05);padding:18px 20px;">
      <p style="font-family:${MONO};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${COLOR.tenue};margin:0 0 6px;">${escapeHtml(opciones.etiqueta)}</p>
      <p style="font-family:${FUENTE};font-size:26px;font-weight:700;color:${COLOR.titulo};margin:0;line-height:1.2;">${escapeHtml(opciones.valor)}</p>
      ${opciones.detalle ? `<p style="font-family:${MONO};font-size:15px;color:${COLOR.marca};margin:6px 0 0;">${escapeHtml(opciones.detalle)}</p>` : ''}
      ${opciones.nota ? `<p style="font-family:${FUENTE};font-size:12px;color:${COLOR.tenue};line-height:1.6;margin:12px 0 0;">${escapeHtml(opciones.nota)}</p>` : ''}
    </td></tr>
  </table>`;
}

/** Una lista de renglones con su valor a la derecha: el detalle de lo comprado. */
export function detalle(filas: { label: string; valor: string }[]): string {
  const cuerpo = filas.map((fila) => `<tr>
      <td style="font-family:${FUENTE};font-size:13.5px;color:${COLOR.texto};padding:7px 0;border-bottom:1px solid ${COLOR.borde};">${escapeHtml(fila.label)}</td>
      <td align="right" style="font-family:${MONO};font-size:13px;color:${COLOR.titulo};padding:7px 0;border-bottom:1px solid ${COLOR.borde};white-space:nowrap;">${escapeHtml(fila.valor)}</td>
    </tr>`).join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">${cuerpo}</table>`;
}

/** El botón. Uno solo por correo: dos botones es ninguno. */
export function boton(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px;">
    <tr><td style="border-radius:8px;background:${COLOR.marca};">
      <a href="${escapeHtml(url)}" style="display:inline-block;font-family:${FUENTE};font-size:14px;font-weight:700;color:${COLOR.fondo};text-decoration:none;padding:13px 30px;">${escapeHtml(texto)}</a>
    </td></tr>
  </table>`;
}

/** Lo que hay que saber pero no se mira primero. */
export function nota(texto: string): string {
  return `<p style="font-family:${FUENTE};font-size:12.5px;color:${COLOR.tenue};line-height:1.65;margin:0 0 10px;">${escapeHtml(texto)}</p>`;
}

/** Instrucciones que se copian y pegan: alias, CBU, un link. */
export function bloqueDatos(etiqueta: string, contenido: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">
    <tr><td style="border:1px solid ${COLOR.borde};border-radius:10px;background:rgba(255,255,255,0.02);padding:16px 20px;">
      <p style="font-family:${MONO};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${COLOR.tenue};margin:0 0 8px;">${escapeHtml(etiqueta)}</p>
      <p style="font-family:${MONO};font-size:13.5px;color:${COLOR.titulo};line-height:1.7;margin:0;word-break:break-word;">${escapeHtml(contenido)}</p>
    </td></tr>
  </table>`;
}

/** El sobre: cabecera, cuerpo y pie, iguales en los tres correos. */
export function emailLayout(opciones: EmailLayout): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
  const dominio = siteUrl.replace('https://', '').replace('http://', '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <title>${escapeHtml(opciones.titulo)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.fondo};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opciones.preheader)}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLOR.fondo};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px;background:${COLOR.panel};border:1px solid ${COLOR.borde};border-radius:14px;overflow:hidden;">

        <tr><td style="height:2px;background:linear-gradient(90deg,transparent,${COLOR.marca},transparent);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:34px 34px 36px;">
          <p style="font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${COLOR.marca};margin:0 0 20px;">${escapeHtml(opciones.eyebrow)}</p>

          ${opciones.paso ? cintaDePasos(opciones.paso) : ''}

          <h1 style="font-family:${FUENTE};font-size:22px;font-weight:700;color:${COLOR.titulo};line-height:1.35;margin:0 0 18px;">${escapeHtml(opciones.titulo)}</h1>

          ${opciones.cuerpo}
        </td></tr>

        <tr><td style="padding:16px 34px 20px;border-top:1px solid ${COLOR.borde};">
          <p style="font-family:${FUENTE};font-size:12px;color:${COLOR.tenue};line-height:1.6;margin:0;">
            Respondé este correo si necesitás algo, lo leo yo.
          </p>
          <p style="font-family:${MONO};font-size:11px;color:rgba(100,116,139,0.7);margin:8px 0 0;">
            Silvano Puccini · <a href="${siteUrl}" style="color:rgba(100,116,139,0.9);text-decoration:none;">${escapeHtml(dominio)}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
