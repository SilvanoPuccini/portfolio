import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * El contrato que se firma.
 *
 * `buildContractDoc` traduce una fila de `leads` —cargada a las apuradas, con
 * columnas que pueden venir nulas— en el documento que el cliente firma. Todo
 * lo que arregla en el camino (el nombre en mayúsculas, la seña negociada, la
 * respuesta sin la pregunta) vivía sin un solo test: el archivo existía vacío.
 *
 * Los helpers son privados a propósito, así que se prueban por donde se usan:
 * se intercepta `buildContract` y se mira el `ContractData` que recibe.
 */

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
// Se intercepta el generador del PDF para mirar el `ContractData` que recibe:
// lo que se prueba acá es la traducción de la fila de `leads` al contrato, no
// el dibujo del documento —eso vive en contrato-pdf.test.ts.
vi.mock('@/lib/contrato-pdf', () => ({
  buildContractPdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.7 fake')),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { buildContractPdf } from '@/lib/contrato-pdf';
import { buildContractDoc } from './documents';

/** Una fila de `leads` y su `rate_config`. `single` sirve a las dos consultas. */
function supabaseConLead(lead: Record<string, unknown> | null) {
  const from = vi.fn().mockImplementation((tabla: string) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(
          tabla === 'leads'
            ? { data: lead, error: lead ? null : { message: 'no existe' } }
            : { data: { tarifa_hora: 35, buffer_pct: 20 }, error: null },
        ),
      }),
    }),
  }));
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
}

/** El `ContractData` con el que se armó el documento. */
async function contratoDe(lead: Record<string, unknown>) {
  supabaseConLead(lead);
  const doc = await buildContractDoc('lead-1', 'Jurisdicción de los tribunales de Córdoba.');
  return { doc, data: vi.mocked(buildContractPdf).mock.calls[0][0] };
}

const BASE = { titular: 'Estefanía Ortigosa', pais: 'Argentina', monto_presupuestado: 4800, horas_calculadas: 120 };

describe('buildContractDoc — quién firma', () => {
  beforeEach(() => vi.clearAllMocks());

  it('escribe el nombre con mayúscula inicial sin tocar las preposiciones', async () => {
    // El cliente carga su nombre apurado y en minúscula. Un contrato que dice
    // «estefania ortigosa» se lee como un borrador, no como un documento.
    const { data } = await contratoDe({ ...BASE, titular: 'maría de los ángeles pérez' });

    expect(data.clientName).toBe('María de los Ángeles Pérez');
  });

  it('cae en el nombre del formulario cuando no hay titular cargado', async () => {
    const { data } = await contratoDe({ ...BASE, titular: null, nombre: 'ferrelon srl' });

    expect(data.clientName).toBe('Ferrelon Srl');
  });

  it('usa el país como localidad cuando la localidad está vacía', async () => {
    const { data } = await contratoDe({ ...BASE, localidad: null, pais: 'chile' });

    expect(data.clientLocation).toBe('Chile');
    expect(data.clientCountry).toBe('Chile');
  });

  it('dice «Sin especificar» en vez de dejar el renglón en blanco', async () => {
    const { data } = await contratoDe({ ...BASE, titular: 'Ana', localidad: null, pais: null });

    expect(data.clientLocation).toBe('Sin especificar');
    expect(data.clientCountry).toBe('Sin especificar');
  });
});

describe('buildContractDoc — qué se firma', () => {
  beforeEach(() => vi.clearAllMocks());

  it('arma el objeto con lo cotizado, no con lo que el cliente escribió en la web', async () => {
    const { data } = await contratoDe({
      ...BASE,
      diagnostico_requerimiento: 'Qué necesitás\nUna tienda con cobro online',
      modulos_seleccionados: [
        { slug: 'tienda', label: 'Tienda con cobro', precioUsd: 1200 },
        { slug: 'blog', label: 'Blog', horas: 12 },
      ],
    });

    expect(data.projectDescription).toBe('Una tienda con cobro online. Incluye: Tienda con cobro, Blog.');
  });

  it('separa la respuesta de la pregunta: el interrogatorio no entra en el contrato', async () => {
    // La guía guarda «pregunta\nrespuesta» desde que completa los campos sola.
    const { data } = await contratoDe({
      ...BASE,
      diagnostico_requerimiento: '¿Qué necesitás resolver?\nVender sin atender por WhatsApp',
    });

    expect(data.projectDescription).toBe('Vender sin atender por WhatsApp');
    expect(data.projectDescription).not.toContain('¿');
  });

  it('lista los entregables con su precio cerrado o sus horas estimadas', async () => {
    const { data } = await contratoDe({
      ...BASE,
      modulos_seleccionados: [
        { slug: 'landing', label: 'Landing', precioUsd: 600 },
        { slug: 'medida', label: 'Integración a medida', horas: 8 },
      ],
    });

    expect(data.deliverables).toBe('· Landing (USD 600)\n· Integración a medida (8 h estimadas)');
  });

  it('descarta una línea sin precio y sin horas antes de que llegue al contrato', async () => {
    const { data } = await contratoDe({
      ...BASE,
      modulos_seleccionados: [
        { slug: 'landing', label: 'Landing', precioUsd: 600 },
        { slug: 'roto', label: 'Módulo sin datos' },
      ],
    });

    expect(data.deliverables).toBe('· Landing (USD 600)');
  });

  it('no deja el objeto ni los entregables vacíos cuando no hay nada cargado', async () => {
    const { data } = await contratoDe({ ...BASE });

    expect(data.projectDescription).toContain('Desarrollo web a medida');
    expect(data.deliverables).toContain('según especificaciones acordadas');
  });
});

describe('buildContractDoc — cuánto y cómo se paga', () => {
  beforeEach(() => vi.clearAllMocks());

  it('respeta la seña que se negoció', async () => {
    // Si se acordó 30 %, el contrato tiene que decir 30 % y no el 50 % de la plantilla.
    const { data } = await contratoDe({ ...BASE, sena_pct: 30 });

    expect(data.paymentTerms).toBe('30% al inicio, 70% contra entrega');
  });

  it('el pago único manda sobre la seña', async () => {
    const { data } = await contratoDe({ ...BASE, sena_pct: 30, pago_unico: true });

    expect(data.paymentTerms).toBe('Pago único al inicio del proyecto');
  });

  it('sin nada acordado deja el 50 y 50 de siempre', async () => {
    const { data } = await contratoDe({ ...BASE });

    expect(data.paymentTerms).toBe('50% al inicio, 50% contra entrega');
  });

  it('calcula el total por horas cuando no hay monto presupuestado', async () => {
    const { data } = await contratoDe({ ...BASE, monto_presupuestado: null, horas_calculadas: 10 });

    expect(data.totalPrice).toBe(350); // 10 h × 35
    expect(data.hourlyRate).toBe(35);
  });

  it('nunca promete cero semanas de plazo', async () => {
    const { data } = await contratoDe({ ...BASE, horas_calculadas: 0 });

    expect(data.estimatedWeeks).toBe(4);
  });

  it('redondea el plazo para arriba: 120 h no entran en tres semanas justas', async () => {
    const { data } = await contratoDe({ ...BASE, horas_calculadas: 121 });

    expect(data.estimatedWeeks).toBe(4);
  });
});

describe('buildContractDoc — el archivo que se descarga', () => {
  beforeEach(() => vi.clearAllMocks());

  it('nombra el archivo con el nombre legible del cliente, acentos incluidos', async () => {
    const { doc } = await contratoDe({ ...BASE });

    expect(doc?.filename).toBe('Contrato · Estefanía Ortigosa.pdf');
  });

  it('saca los caracteres que Windows rechaza en vez de romper la descarga', async () => {
    const { doc } = await contratoDe({ ...BASE, titular: 'Ferrelon: Stock / Ventas' });

    expect(doc?.filename).toBe('Contrato · Ferrelon Stock Ventas.pdf');
  });

  it('pasa la cláusula de jurisdicción tal cual se la dieron', async () => {
    const { data } = await contratoDe({ ...BASE });

    expect(data.legalClause).toBe('Jurisdicción de los tribunales de Córdoba.');
  });

  it('devuelve null si el lead no existe, sin armar ningún documento', async () => {
    supabaseConLead(null);

    const doc = await buildContractDoc('no-existe', 'x');

    expect(doc).toBeNull();
    expect(buildContractPdf).not.toHaveBeenCalled();
  });
});
