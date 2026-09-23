import { describe, expect, it } from 'vitest';

import { RESPUESTA_UNICA, pedidoParaRetomar, type PedidoAbierto } from './recuperar-pedido';

/**
 * Volver al pedido que ya empezaste.
 *
 * Sin esto el cliente que perdía el link empezaba de cero, y nacía un segundo
 * lead del mismo cliente con otro pedido a medias: dos ventas donde hay una.
 */

const pedido = (over: Partial<PedidoAbierto> = {}): PedidoAbierto => ({
  pedidoId: 'p1', etapa: 'firma', creadoAt: '2026-09-20T10:00:00Z', ...over,
});

describe('pedidoParaRetomar', () => {
  it('sin pedidos no inventa ninguno', () => {
    expect(pedidoParaRetomar([])).toBeNull();
  });

  it('devuelve el único que tiene', () => {
    expect(pedidoParaRetomar([pedido()])?.pedidoId).toBe('p1');
  });

  it('prefiere el más reciente de los que siguen abiertos', () => {
    const elegido = pedidoParaRetomar([
      pedido({ pedidoId: 'viejo', creadoAt: '2026-08-01T10:00:00Z' }),
      pedido({ pedidoId: 'nuevo', creadoAt: '2026-09-22T10:00:00Z' }),
    ]);

    expect(elegido?.pedidoId).toBe('nuevo');
  });

  it('salta el que ya está pagado y va al que quedó a medias', () => {
    // Un pedido terminado no es algo a lo que «volver»: mandarlo ahí sería
    // contestarle otra pregunta.
    const elegido = pedidoParaRetomar([
      pedido({ pedidoId: 'terminado', etapa: 'listo', creadoAt: '2026-09-22T10:00:00Z' }),
      pedido({ pedidoId: 'a-medias', etapa: 'pago', creadoAt: '2026-09-01T10:00:00Z' }),
    ]);

    expect(elegido?.pedidoId).toBe('a-medias');
  });

  it('si todos terminaron, manda el último igual', () => {
    // El que escribe su correo quiere llegar a su proyecto, no a un paso.
    const elegido = pedidoParaRetomar([
      pedido({ pedidoId: 'viejo', etapa: 'listo', creadoAt: '2026-08-01T10:00:00Z' }),
      pedido({ pedidoId: 'ultimo', etapa: 'listo', creadoAt: '2026-09-22T10:00:00Z' }),
    ]);

    expect(elegido?.pedidoId).toBe('ultimo');
  });

  it('no altera la lista que le pasan', () => {
    const lista = [
      pedido({ pedidoId: 'a', creadoAt: '2026-08-01T10:00:00Z' }),
      pedido({ pedidoId: 'b', creadoAt: '2026-09-22T10:00:00Z' }),
    ];

    pedidoParaRetomar(lista);

    expect(lista.map((p) => p.pedidoId)).toEqual(['a', 'b']);
  });
});

describe('RESPUESTA_UNICA', () => {
  it('no confirma ni desmiente que el correo exista', () => {
    // Si la respuesta cambiara, el formulario sería una forma de averiguar
    // quién te compró probando correos ajenos.
    expect(RESPUESTA_UNICA).toMatch(/si hay/i);
    expect(RESPUESTA_UNICA).not.toMatch(/no existe|no encontr|no hay ning/i);
  });
});
