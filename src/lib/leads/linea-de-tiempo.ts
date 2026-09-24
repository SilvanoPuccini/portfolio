import type { Locale } from '@/content/servicios';
import { sumarDiasHabiles } from './capacidad';

/**
 * Lo que pasa después de comprar, con fechas.
 *
 * El cliente cargaba su material y la pantalla le decía «Listo» y nada más.
 * Pagó y no sabía cuándo iba a tener lo que compró: esa incertidumbre es la
 * que hace que alguien escriba «¿y? ¿cómo va?» a los tres días. Acá ve el
 * camino entero, lo hecho tildado y lo que falta con su fecha.
 *
 * La fecha de entrega es la del contrato: el máximo. Si llega antes, mejor.
 */

export interface PasoDelProyecto {
  id: 'pago' | 'material' | 'arranque' | 'entrega' | 'ajustes' | 'garantia';
  titulo: string;
  detalle: string;
  fecha?: string;
  hecho: boolean;
}

const COPY = {
  es: {
    pago: 'Pago confirmado',
    material: 'Material recibido',
    arranque: 'Arranco con tu proyecto',
    arrancoYa: 'Ya está en mi agenda: empiezo ahora.',
    arrancoCon: (dias: number) => `Hay ${dias === 1 ? 'un día' : `${dias} días`} de trabajo antes que el tuyo.`,
    entrega: 'Entrega',
    entregaDetalle: 'Es el plazo máximo del contrato. Si está antes, te aviso antes.',
    ajustes: 'Una ronda de ajustes',
    ajustesDetalle: 'Me decís qué cambiar dentro de los 10 días de la entrega y lo resuelvo.',
    garantia: '30 días de garantía',
    garantiaDetalle: 'Si algo de lo entregado falla, lo arreglo sin costo.',
    hasta: 'hasta el',
  },
  en: {
    pago: 'Payment confirmed',
    material: 'Material received',
    arranque: 'I start on your project',
    arrancoYa: 'It is already on my schedule: I am starting now.',
    arrancoCon: (dias: number) => `There ${dias === 1 ? 'is one day' : `are ${dias} days`} of work ahead of yours.`,
    entrega: 'Delivery',
    entregaDetalle: 'That is the contract deadline. If it is ready earlier, you will hear from me earlier.',
    ajustes: 'One round of changes',
    ajustesDetalle: 'Tell me what to change within 10 days of delivery and I will take care of it.',
    garantia: '30-day warranty',
    garantiaDetalle: 'If anything delivered breaks, I fix it at no cost.',
    hasta: 'by',
  },
} as const;

function formato(fecha: Date, locale: Locale): string {
  return fecha.toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export function lineaDeTiempo(entrada: {
  cobradoAt: string | null;
  materialAt: string | null;
  /** Días hábiles del contrato, con la espera ya incluida. */
  plazoMaximo: number;
  espera: number;
  locale: Locale;
}): PasoDelProyecto[] {
  const t = COPY[entrada.locale];

  // El plazo corre desde lo último que faltaba: el pago o el material.
  const marcas = [entrada.cobradoAt, entrada.materialAt].filter(Boolean).map((f) => new Date(f!).getTime());
  const desde = new Date(marcas.length ? Math.max(...marcas) : Date.now());

  const arranque = sumarDiasHabiles(desde, entrada.espera);
  const entrega = sumarDiasHabiles(desde, entrada.plazoMaximo);

  return [
    {
      id: 'pago', titulo: t.pago, detalle: '', hecho: Boolean(entrada.cobradoAt),
      fecha: entrada.cobradoAt ? formato(new Date(entrada.cobradoAt), entrada.locale) : undefined,
    },
    {
      id: 'material', titulo: t.material, detalle: '', hecho: Boolean(entrada.materialAt),
      fecha: entrada.materialAt ? formato(new Date(entrada.materialAt), entrada.locale) : undefined,
    },
    {
      id: 'arranque', titulo: t.arranque, hecho: false,
      detalle: entrada.espera > 0 ? t.arrancoCon(entrada.espera) : t.arrancoYa,
      fecha: entrada.espera > 0 ? formato(arranque, entrada.locale) : undefined,
    },
    {
      id: 'entrega', titulo: t.entrega, detalle: t.entregaDetalle, hecho: false,
      fecha: entrada.plazoMaximo > 0 ? `${t.hasta} ${formato(entrega, entrada.locale)}` : undefined,
    },
    { id: 'ajustes', titulo: t.ajustes, detalle: t.ajustesDetalle, hecho: false },
    { id: 'garantia', titulo: t.garantia, detalle: t.garantiaDetalle, hecho: false },
  ];
}
