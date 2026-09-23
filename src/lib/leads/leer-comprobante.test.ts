import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/x/gemini.client', () => ({ callGeminiVision: vi.fn() }));

import { callGeminiVision } from '@/lib/x/gemini.client';
import { leerComprobante } from './leer-comprobante';
import type { LoEsperado } from './comprobante-ocr';

/**
 * El reparto de tareas: el modelo transcribe, nosotros juzgamos.
 *
 * Pedirle al modelo que además decida si el pago cuadra sería poner la
 * decisión de cobrar en algo que no se puede auditar ni testear.
 */

const ESPERADO: LoEsperado = {
  montoUsd: 940,
  montoLocal: { moneda: 'ARS', monto: 1_200_000 },
  instruccionesDePago: 'Alias: silvano.dev.mp',
  nombreCliente: 'Estefanía Ortigosa',
  firmadoAt: '2026-09-20T10:00:00Z',
};

const responde = (datos: Record<string, unknown>) =>
  vi.mocked(callGeminiVision).mockResolvedValue({ data: datos, tokens: 100 } as never);

beforeEach(() => vi.clearAllMocks());

describe('leerComprobante', () => {
  it('transcribe y después juzga con nuestras reglas', async () => {
    responde({
      esComprobante: true, titular: 'Estefanía Ortigosa', destino: 'silvano.dev.mp',
      monto: 1_200_000, moneda: 'ARS', fecha: '2026-09-22', banco: 'Galicia',
    });

    const lectura = await leerComprobante(Buffer.from('x'), 'image/png', ESPERADO);

    expect(lectura?.revision.veredicto).toBe('cuadra');
  });

  it('el veredicto sale de nuestras reglas, no de lo que diga el modelo', async () => {
    // El modelo solo transcribe: si transcribe una cuenta ajena, el veredicto
    // lo pone el código aunque el modelo no haya opinado nada.
    responde({
      esComprobante: true, titular: 'Estefanía', destino: 'cuenta.de.otro',
      monto: 1_200_000, moneda: 'ARS', fecha: '2026-09-22', banco: 'Galicia',
    });

    const lectura = await leerComprobante(Buffer.from('x'), 'image/png', ESPERADO);

    expect(lectura?.revision.veredicto).toBe('no-cuadra');
  });

  it('manda el archivo en base64 con su tipo', async () => {
    responde({ esComprobante: true });

    await leerComprobante(Buffer.from('hola'), 'application/pdf', ESPERADO);

    const [, archivo] = vi.mocked(callGeminiVision).mock.calls[0];
    expect(archivo).toEqual({ datos: Buffer.from('hola').toString('base64'), tipo: 'application/pdf' });
  });

  it('le prohíbe inventar lo que no ve', async () => {
    responde({ esComprobante: true });

    await leerComprobante(Buffer.from('x'), 'image/png', ESPERADO);

    const [sistema] = vi.mocked(callGeminiVision).mock.calls[0];
    expect(sistema).toMatch(/no completás|null/i);
  });

  it('si el modelo se cae, el cobro no se frena', async () => {
    // El comprobante sigue archivado y se mira a mano, como siempre.
    vi.mocked(callGeminiVision).mockRejectedValue(new Error('sin cuota'));

    expect(await leerComprobante(Buffer.from('x'), 'image/png', ESPERADO)).toBeNull();
  });
});
