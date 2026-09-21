import { describe, expect, it } from 'vitest';

import { armarPresupuesto } from './presupuesto';
import type { PertRow } from './types';

const fila = (slug: string, horas: number, selected = true): PertRow => ({
  slug,
  label: slug,
  o: horas,
  m: horas,
  p: horas,
  selected,
});

const tarifa = { tarifaHora: 30, bufferPct: 0 };

describe('armarPresupuesto', () => {
  it('sin paquete cotiza solo con las filas tildadas, como hasta ahora', () => {
    const p = armarPresupuesto({ pertRows: [fila('a', 10), fila('b', 5, false)], ...tarifa });
    expect(p.esAMedida).toBe(true);
    expect(p.horasMedida).toBe(10);
    expect(p.totalUsd).toBe(300);
    expect(p.lineas).toHaveLength(1);
  });

  it('con paquete, el precio de lista es la base', () => {
    const p = armarPresupuesto({ paqueteSlug: 'web-cinco-secciones', ...tarifa });
    expect(p.esAMedida).toBe(false);
    expect(p.catalogoUsd).toBe(790);
    expect(p.totalUsd).toBe(790);
    expect(p.lineas[0]).toMatchObject({ tipo: 'paquete', precioUsd: 790 });
  });

  it('suma los extras del servicio del paquete', () => {
    const p = armarPresupuesto({
      paqueteSlug: 'web-cinco-secciones',
      extrasIds: ['agenda', 'panel'],
      ...tarifa,
    });
    expect(p.totalUsd).toBe(790 + 150 + 250);
    expect(p.lineas.filter((l) => l.tipo === 'extra')).toHaveLength(2);
  });

  it('no cobra dos veces lo que el paquete ya incluye', () => {
    const p = armarPresupuesto({
      paqueteSlug: 'web-cinco-secciones',
      pertRows: [fila('seo-tecnico', 8), fila('chat-en-vivo', 6)],
      ...tarifa,
    });
    expect(p.lineas.some((l) => l.slug === 'seo-tecnico')).toBe(false);
    expect(p.horasMedida).toBe(6);
    expect(p.totalUsd).toBe(790 + 180);
  });

  it('tampoco cobra dos veces lo que cubre un extra elegido', () => {
    const p = armarPresupuesto({
      paqueteSlug: 'web-cinco-secciones',
      extrasIds: ['agenda'],
      pertRows: [fila('agenda-turnos', 5)],
      ...tarifa,
    });
    expect(p.horasMedida).toBe(0);
    expect(p.totalUsd).toBe(790 + 150);
  });

  it('el buffer se aplica solo a las horas a medida', () => {
    const p = armarPresupuesto({
      paqueteSlug: 'web-cinco-secciones',
      pertRows: [fila('chat-en-vivo', 10)],
      tarifaHora: 30,
      bufferPct: 20,
    });
    expect(p.horasMedida).toBe(12);
    expect(p.totalUsd).toBe(790 + 360);
  });

  it('un plan mensual no infla el total del proyecto', () => {
    const p = armarPresupuesto({ paqueteSlug: 'cuidado-completo', ...tarifa });
    expect(p.totalUsd).toBe(0);
    expect(p.mensualUsd).toBe(90);
  });

  it('un paquete a cotizar toma su número de las filas tildadas', () => {
    const p = armarPresupuesto({
      paqueteSlug: 'tienda-a-medida',
      pertRows: [fila('catalogo', 40)],
      ...tarifa,
    });
    expect(p.catalogoUsd).toBe(0);
    expect(p.totalUsd).toBe(1200);
  });

  it('un slug de paquete que no existe no rompe nada', () => {
    const p = armarPresupuesto({ paqueteSlug: 'inventado', pertRows: [fila('a', 10)], ...tarifa });
    expect(p.esAMedida).toBe(true);
    expect(p.totalUsd).toBe(300);
  });

  it('sin nada elegido el total es cero', () => {
    expect(armarPresupuesto({ ...tarifa }).totalUsd).toBe(0);
  });
});
