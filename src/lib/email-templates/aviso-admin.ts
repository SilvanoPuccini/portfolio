import { escapeHtml } from '@/lib/html-escape';
import type { Hallazgo, Veredicto } from '@/lib/leads/comprobante-ocr';

/**
 * Los avisos que le llegan a Silvano cuando un cliente hace algo.
 *
 * Eran un párrafo gris igual para todo: firmar, pagar y cargar el material se
 * veían idénticos en la bandeja y había que abrir cada uno para saber qué
 * pasó. Ahora cada evento tiene su marca en el asunto, su color y su icono, y
 * el cuerpo dice lo justo para decidir sin entrar al panel.
 *
 * Tablas y estilos en línea: es lo único que respetan Gmail y Outlook.
 */

export type TipoAviso = 'firma' | 'pago' | 'material';

const FUENTE = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,monospace";

const BASE = {
  fondo: '#050810',
  panel: '#0b1120',
  borde: 'rgba(255,255,255,0.08)',
  titulo: '#f0f0f0',
  texto: '#cbd5e1',
  tenue: '#64748b',
} as const;

const ESTILO: Record<TipoAviso, { icono: string; etiqueta: string; color: string }> = {
  firma: { icono: '✍️', etiqueta: 'Contrato firmado', color: '#a78bfa' },
  pago: { icono: '💳', etiqueta: 'Pago informado', color: '#f59e0b' },
  material: { icono: '📦', etiqueta: 'Material cargado', color: '#22d3ee' },
};

const POR_VEREDICTO: Record<Veredicto, { color: string; titulo: string; corto: string }> = {
  cuadra: { color: '#4ade80', titulo: 'El comprobante cuadra', corto: '✓ cuadra' },
  revisar: { color: '#f59e0b', titulo: 'El comprobante necesita una mirada', corto: '! revisar' },
  'no-cuadra': { color: '#f87171', titulo: 'El comprobante no cuadra', corto: '✕ no cuadra' },
};

const MARCA: Record<Hallazgo['senal'], { signo: string; color: string }> = {
  ok: { signo: '✓', color: '#4ade80' },
  atencion: { signo: '!', color: '#f59e0b' },
  mal: { signo: '✕', color: '#f87171' },
};

/**
 * El asunto: la marca del evento primero, para leerlo en la lista sin abrir.
 * En el pago va además el veredicto del comprobante.
 */
export function asuntoDeAviso(tipo: TipoAviso, cliente: string, detalle: string, veredicto?: Veredicto | null): string {
  const { icono } = ESTILO[tipo];
  if (tipo === 'firma') return `${icono} Firmó ${cliente} · ${detalle}`;
  if (tipo === 'material') return `${icono} ${cliente}: ${detalle}`;
  const estado = veredicto ? ` · ${POR_VEREDICTO[veredicto].corto}` : '';
  return `${icono} Pagó ${cliente} · ${detalle}${estado}`;
}

export interface AvisoAdmin {
  tipo: TipoAviso;
  titulo: string;
  resumen: string;
  /** Los datos clave, en dos columnas. */
  filas?: { label: string; valor: string }[];
  /** Solo en el pago: lo que vio la lectura del comprobante. */
  veredicto?: Veredicto | null;
  hallazgos?: Hallazgo[];
  /** El `contentId` del comprobante adjunto, para verlo sin descargar. */
  imagenCid?: string;
  /** Qué hacer ahora, en una línea. */
  siguiente?: string;
  urlFicha: string;
}

function filasHtml(filas: { label: string; valor: string }[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">
    ${filas.map((f) => `<tr>
      <td style="padding:7px 0;border-bottom:1px solid ${BASE.borde};font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${BASE.tenue};width:38%;vertical-align:top;">${escapeHtml(f.label)}</td>
      <td style="padding:7px 0;border-bottom:1px solid ${BASE.borde};font-family:${FUENTE};font-size:14px;color:${BASE.titulo};vertical-align:top;">${escapeHtml(f.valor)}</td>
    </tr>`).join('')}
  </table>`;
}

function revisionHtml(veredicto: Veredicto | null | undefined, hallazgos: Hallazgo[]): string {
  const v = veredicto ? POR_VEREDICTO[veredicto] : null;
  const color = v?.color ?? BASE.tenue;
  const titulo = v?.titulo ?? 'No se pudo leer el comprobante automáticamente';

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;border:1px solid ${color};border-radius:10px;">
    <tr><td style="padding:14px 16px;">
      <p style="font-family:${FUENTE};font-size:14px;font-weight:700;color:${color};margin:0 0 8px;">${escapeHtml(titulo)}</p>
      ${hallazgos.map((h) => `<p style="font-family:${FUENTE};font-size:13px;line-height:1.55;color:${h.senal === 'ok' ? BASE.texto : MARCA[h.senal].color};margin:0 0 4px;">
        <span style="display:inline-block;width:16px;font-weight:700;color:${MARCA[h.senal].color};">${MARCA[h.senal].signo}</span>${escapeHtml(h.detalle)}
      </p>`).join('')}
      <p style="font-family:${FUENTE};font-size:12px;color:${BASE.tenue};margin:10px 0 0;">
        La revisión no aprueba nada: confirmalo vos desde el panel.
      </p>
    </td></tr>
  </table>`;
}

export function avisoAdmin(aviso: AvisoAdmin): string {
  const estilo = ESTILO[aviso.tipo];
  // En el pago manda el veredicto: verde, ámbar o rojo se ve antes de leer.
  const color = aviso.tipo === 'pago' && aviso.veredicto ? POR_VEREDICTO[aviso.veredicto].color : estilo.color;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <title>${escapeHtml(aviso.titulo)}</title>
</head>
<body style="margin:0;padding:0;background:${BASE.fondo};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(aviso.resumen)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BASE.fondo};padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:${BASE.panel};border:1px solid ${BASE.borde};border-radius:14px;overflow:hidden;">
        <tr><td style="height:4px;background:${color};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 30px 30px;">

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
            <tr>
              <td style="width:44px;height:44px;border-radius:12px;background:${color}22;text-align:center;vertical-align:middle;font-size:22px;line-height:44px;">${estilo.icono}</td>
              <td style="padding-left:12px;font-family:${MONO};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${color};">${estilo.etiqueta}</td>
            </tr>
          </table>

          <h1 style="font-family:${FUENTE};font-size:21px;font-weight:700;color:${BASE.titulo};line-height:1.35;margin:0 0 8px;">${escapeHtml(aviso.titulo)}</h1>
          <p style="font-family:${FUENTE};font-size:15px;line-height:1.6;color:${BASE.texto};margin:0 0 22px;">${escapeHtml(aviso.resumen)}</p>

          ${aviso.filas?.length ? filasHtml(aviso.filas) : ''}
          ${aviso.tipo === 'pago' && aviso.hallazgos ? revisionHtml(aviso.veredicto, aviso.hallazgos) : ''}

          ${aviso.imagenCid ? `<p style="font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BASE.tenue};margin:0 0 8px;">Comprobante</p>
          <img src="cid:${escapeHtml(aviso.imagenCid)}" alt="Comprobante de pago" width="500" style="display:block;width:100%;max-width:500px;height:auto;border:1px solid ${BASE.borde};border-radius:10px;margin:0 0 22px;"/>` : ''}

          ${aviso.siguiente ? `<p style="font-family:${FUENTE};font-size:14px;line-height:1.6;color:${BASE.titulo};margin:0 0 20px;"><strong style="color:${color};">Ahora:</strong> ${escapeHtml(aviso.siguiente)}</p>` : ''}

          <a href="${escapeHtml(aviso.urlFicha)}" style="display:inline-block;background:${color};color:#0b1120;font-family:${FUENTE};font-size:14px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:9px;">Abrir la ficha →</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
