import { describe, expect, it } from 'vitest';

import { ALCANCE_POR_EXTRA, ALCANCE_POR_PAQUETE } from './alcance-contractual';
import { contratoComoTexto, contratoDeVenta } from './contrato';
import { paquetePorSlug, paquetes, plazoDelPedido, SERVICIOS, servicioPorSlug, totalPedido } from './servicios';
import { legalClauseFor } from '@/lib/leads/legal-clause';

/**
 * El contrato de una venta del catálogo tiene que decir lo que se compró.
 *
 * Caso real: el cliente eligió Landing + Logo tipográfico por USD 530. El
 * contrato copiaba los textos de venta en primera persona, el logo aparecía
 * sin precio ni detalle, el plazo decía «1 semana» contra «5 días hábiles» de
 * la página, el domicilio decía «Argentina, Argentina» y la cláusula de
 * jurisdicción era un fragmento suelto.
 */

function contratoDe(slug: string, extrasIds: string[], cliente = { nombre: 'Force Corp', localidad: null as string | null, pais: 'Argentina' }) {
  const paquete = paquetePorSlug(slug)!;
  const resumen = totalPedido(paquete, extrasIds, servicioPorSlug(paquete.servicio)!.extras);
  return {
    resumen,
    datos: contratoDeVenta({
      paquete,
      extras: resumen.extras,
      cliente,
      totalUsd: resumen.totalUsd ?? 0,
      jurisdiccion: legalClauseFor(cliente.pais),
    }),
  };
}

describe('contratoDeVenta — Landing + Logo, el caso real', () => {
  const { datos, resumen } = contratoDe('landing', ['logo']);
  const texto = contratoComoTexto(datos);

  it('el logo figura como entregable con su detalle', () => {
    expect(datos.deliverables).toContain(ALCANCE_POR_EXTRA.logo);
  });

  it('el precio va desglosado: paquete más adicional', () => {
    expect(texto).toContain('Landing: USD 450');
    expect(texto).toContain('Logo tipográfico: USD 80');
    expect(resumen.totalUsd).toBe(530);
  });

  it('el plazo es en días hábiles y suma los días del logo', () => {
    const paquete = paquetePorSlug('landing')!;
    const dias = plazoDelPedido(paquete, resumen.extras);

    expect(dias).toBeGreaterThan(paquete.plazoDias);
    expect(datos.plazoDiasHabiles).toBe(dias);
    expect(texto).toContain(`(${dias}) días hábiles`);
    expect(texto).not.toMatch(/\d+ semanas?/);
  });

  it('no habla en primera persona ni con voseo', () => {
    expect(texto).not.toContain('me contás');
    expect(texto).not.toContain('los escribo yo');
    expect(texto).not.toContain('tu rubro');
  });

  it('el domicilio no repite el país', () => {
    expect(texto).not.toContain('Argentina, Argentina');
    expect(texto).toContain('con domicilio en Argentina.');
  });

  it('la jurisdicción es una oración completa', () => {
    expect(texto).toContain('El presente contrato se regirá e interpretará conforme a las leyes');
  });
});

describe('contratoDeVenta — cargos mensuales', () => {
  it('el plan de automatización obligatorio queda escrito como cargo mensual', () => {
    const { datos } = contratoDe('una-automatizacion', ['plan-automatizacion']);
    const texto = contratoComoTexto(datos);

    expect(texto).toContain('cargo mensual de USD 60');
    // Lo mensual no es un entregable del proyecto.
    expect(datos.deliverables).not.toContain('Adicional contratado — Plan mensual');
  });
});

describe('alcance contractual — el catálogo entero', () => {
  it('todo paquete con precio cerrado tiene su alcance escrito para contrato', () => {
    const sinAlcance = paquetes()
      .filter((paquete) => paquete.precioUsd !== null)
      .filter((paquete) => !ALCANCE_POR_PAQUETE[paquete.slug])
      .map((paquete) => paquete.slug);

    expect(sinAlcance).toEqual([]);
  });

  it('todo extra tiene su renglón de contrato', () => {
    const sinAlcance = SERVICIOS.flatMap((s) => s.extras)
      .filter((extra) => !ALCANCE_POR_EXTRA[extra.id])
      .map((extra) => extra.id);

    expect(sinAlcance).toEqual([]);
  });

  it('ningún entregable remite a otro paquete en vez de decir qué incluye', () => {
    const remiten = Object.entries(ALCANCE_POR_PAQUETE)
      .filter(([, alcance]) => alcance.entregables.some((linea) => /^todo lo de/i.test(linea)))
      .map(([slug]) => slug);

    expect(remiten).toEqual([]);
  });

  it('todo extra que se entrega una sola vez suma días al plazo', () => {
    const sinDias = SERVICIOS.flatMap((s) => s.extras)
      .filter((extra) => !extra.recurrente && !extra.diasHabiles)
      .map((extra) => extra.id);

    expect(sinDias).toEqual([]);
  });
});
