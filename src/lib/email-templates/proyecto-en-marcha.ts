import { escapeHtml } from '@/lib/html-escape';
import type { PasoDelProyecto } from '@/lib/leads/linea-de-tiempo';
import { boton, emailLayout, nota, panelDestacado, parrafo } from './layout';

/**
 * El correo de cuando el cliente terminó de cargar su material.
 *
 * No llegaba nada: el cliente tocaba «terminé» y del otro lado, silencio. Y
 * si cerraba la pestaña se quedaba sin camino para volver a su pedido. Este
 * correo es las dos cosas: la confirmación con las fechas de lo que viene y
 * el link que lo devuelve a su pedido cuando quiera.
 */

export interface ProyectoEnMarchaData {
  nombre: string;
  paquete: string;
  pasos: PasoDelProyecto[];
  urlPedido: string;
}

function camino(pasos: PasoDelProyecto[]): string {
  const filas = pasos.map((paso) => `<tr>
      <td valign="top" width="28" style="padding:0 0 12px;font-family:ui-monospace,monospace;font-size:13px;font-weight:700;color:${paso.hecho ? '#00d4d4' : '#475569'};">${paso.hecho ? '✓' : '○'}</td>
      <td style="padding:0 0 12px;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:${paso.hecho ? '#94a3b8' : '#e2e8f0'};">
        <strong>${escapeHtml(paso.titulo)}</strong>${paso.fecha ? ` · <span style="color:#00d4d4;">${escapeHtml(paso.fecha)}</span>` : ''}
      </td>
    </tr>`).join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">
    <tr><td colspan="2" style="font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;padding:0 0 14px;">Lo que viene</td></tr>
    ${filas}
  </table>`;
}

export function proyectoEnMarchaHtml(data: ProyectoEnMarchaData): string {
  const primerNombre = data.nombre.trim().split(/\s+/)[0] || data.nombre;
  const entrega = data.pasos.find((paso) => paso.id === 'entrega')?.fecha;

  return emailLayout({
    preheader: `Recibí tu material. ${entrega ? `Entrega ${entrega}.` : ''}`,
    eyebrow: 'Proyecto en marcha',
    titulo: `¡Gracias, ${primerNombre}! Tu ${data.paquete} ya está en marcha`,
    paso: 3,
    cuerpo: [
      parrafo('Recibí todo tu material. Desde acá el trabajo es mío: te escribo con cada avance, así no tenés que preguntar.'),
      ...(entrega ? [panelDestacado({ etiqueta: 'Entrega', valor: entrega, nota: 'Es el plazo máximo del contrato. Si está antes, te aviso antes.' })] : []),
      camino(data.pasos),
      boton('Ver mi pedido', data.urlPedido),
      nota('Guardá este correo: el botón te lleva a tu pedido, tu contrato y tu material cuando quieras.'),
    ].join(''),
  });
}
