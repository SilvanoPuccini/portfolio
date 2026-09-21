import { describe, expect, it } from 'vitest';

import {
  SERVICIOS,
  TARIFA_HORA_USD,
  calificaParaComprar,
  paquetePorSlug,
  paquetes,
  precioCierra,
  servicioPorSlug,
  textosFaltantes,
  totalPedido,
  modulosSugeridos,
} from './servicios';

describe('catálogo de servicios', () => {
  it('no repite slugs de servicio', () => {
    const slugs = SERVICIOS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('no repite slugs de paquete en todo el catálogo', () => {
    const slugs = paquetes().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('marca como mucho un paquete destacado por servicio', () => {
    for (const servicio of SERVICIOS) {
      const destacados = servicio.paquetes.filter((p) => p.destacado);
      expect(destacados.length, servicio.slug).toBeLessThanOrEqual(1);
    }
  });

  it('todo paquete con precio cerrado declara horas y plazo', () => {
    for (const pkg of paquetes()) {
      if (pkg.precioUsd === null || pkg.recurrente) continue;
      expect(pkg.horas, pkg.slug).toBeGreaterThan(0);
      expect(pkg.plazoDias, pkg.slug).toBeGreaterThan(0);
    }
  });

  it('un servicio sin paquetes se vende con llamada y explica por qué', () => {
    for (const servicio of SERVICIOS) {
      if (servicio.paquetes.length > 0) continue;
      expect(servicio.modo, servicio.slug).toBe('llamada');
      expect(servicio.porQueNoTienePrecio?.es.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('cada respuesta que no califica dice a dónde va', () => {
    for (const pkg of paquetes()) {
      for (const pregunta of pkg.calificacion) {
        for (const opcion of pregunta.opciones) {
          if (opcion.califica) continue;
          expect(opcion.hacia, `${pkg.slug}/${pregunta.id}/${opcion.valor}`).toBeTruthy();
        }
      }
    }
  });

  it('está escrito en los dos idiomas', () => {
    expect(textosFaltantes()).toEqual([]);
  });

  it('busca servicios y paquetes por slug', () => {
    expect(servicioPorSlug('web')?.slug).toBe('web');
    expect(servicioPorSlug('no-existe')).toBeNull();
    expect(paquetePorSlug('web-cinco-secciones')?.precioUsd).toBe(790);
    expect(paquetePorSlug('no-existe')).toBeNull();
  });
});

describe('precioCierra', () => {
  it('acepta un precio coherente con las horas y la tarifa', () => {
    expect(precioCierra({ horas: 26, precioUsd: 790 }, 30)).toBe(true);
  });

  it('rechaza un precio que se aparta más del 15 %', () => {
    expect(precioCierra({ horas: 26, precioUsd: 300 }, 30)).toBe(false);
  });

  it('todos los paquetes del catálogo cierran con la tarifa vigente', () => {
    for (const pkg of paquetes()) {
      if (pkg.precioUsd === null || pkg.recurrente) continue;
      expect(precioCierra(pkg, TARIFA_HORA_USD), pkg.slug).toBe(true);
    }
  });
});

describe('el límite de cada paquete es el suyo', () => {
  it('cada web califica por su propia cantidad de secciones', () => {
    const califican = ['landing', 'web-cinco-secciones', 'web-con-blog'].map((slug) => {
      const pkg = paquetePorSlug(slug)!;
      return pkg.calificacion[0].opciones.find((o) => o.califica)!.valor;
    });
    expect(new Set(califican).size).toBe(3);
  });

  it('el de cinco secciones no se vende a quien pide una sola', () => {
    const pkg = paquetePorSlug('web-cinco-secciones')!;
    expect(calificaParaComprar(pkg, { secciones: 'una' })).toBe(false);
    expect(calificaParaComprar(pkg, { secciones: 'hasta-cinco' })).toBe(true);
  });
});

describe('calificaParaComprar', () => {
  const pkg = paquetePorSlug('auditoria-web')!;

  it('sin responder, no califica', () => {
    expect(calificaParaComprar(pkg, {})).toBe(false);
  });

  it('con una respuesta fuera del límite, no califica', () => {
    const respuestas = Object.fromEntries(pkg.calificacion.map((q) => [q.id, q.opciones[0].valor]));
    const fuera = pkg.calificacion[0].opciones.find((o) => !o.califica)!;
    expect(calificaParaComprar(pkg, { ...respuestas, [pkg.calificacion[0].id]: fuera.valor })).toBe(false);
  });

  it('con todas las respuestas dentro del límite, califica', () => {
    const respuestas = Object.fromEntries(
      pkg.calificacion.map((q) => [q.id, q.opciones.find((o) => o.califica)!.valor]),
    );
    expect(calificaParaComprar(pkg, respuestas)).toBe(true);
  });

  it('un paquete sin preguntas califica solo', () => {
    expect(calificaParaComprar({ calificacion: [] }, {})).toBe(true);
  });
});

describe('totalPedido', () => {
  const servicio = servicioPorSlug('web')!;
  const pkg = paquetePorSlug('web-cinco-secciones')!;

  it('sin extras es el precio del paquete', () => {
    expect(totalPedido(pkg, [], servicio.extras).totalUsd).toBe(790);
  });

  it('suma los extras elegidos', () => {
    const extra = servicio.extras[0];
    const pedido = totalPedido(pkg, [extra.id], servicio.extras);
    expect(pedido.totalUsd).toBe(790 + extra.precioUsd);
    expect(pedido.extras).toHaveLength(1);
  });

  it('ignora un extra que no existe', () => {
    expect(totalPedido(pkg, ['inventado'], servicio.extras).totalUsd).toBe(790);
  });

  it('un extra mensual no entra en el total del proyecto', () => {
    const auto = servicioPorSlug('automatizacion')!;
    const tres = paquetePorSlug('tres-automatizaciones')!;
    const pedido = totalPedido(tres, ['plan-automatizacion'], auto.extras);
    expect(pedido.totalUsd).toBe(890);
    expect(pedido.recurrenteUsd).toBe(60);
  });

  it('un plan mensual cobra por mes, no por proyecto', () => {
    const plan = paquetePorSlug('cuidado-completo')!;
    const pedido = totalPedido(plan, [], []);
    expect(pedido.totalUsd).toBe(0);
    expect(pedido.recurrenteUsd).toBe(90);
  });

  it('un paquete a cotizar no tiene total', () => {
    const aMedida = paquetes().find((p) => p.precioUsd === null)!;
    expect(totalPedido(aMedida, [], []).totalUsd).toBeNull();
  });
});

describe('modulosSugeridos', () => {
  it('devuelve los módulos del servicio del lead', () => {
    expect(modulosSugeridos('web').length).toBeGreaterThan(0);
  });

  it('sin servicio conocido no sugiere nada', () => {
    expect(modulosSugeridos(null)).toEqual([]);
    expect(modulosSugeridos('cualquiera')).toEqual([]);
  });
});
