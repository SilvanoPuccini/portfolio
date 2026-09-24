import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ComprobantePago } from './ComprobantePago';

/**
 * El comprobante se mira sin salir de la ficha.
 *
 * Era un link que lo abría en otra pestaña. Ahora hay una miniatura y una
 * vista previa sobre la ficha, que se cierra con la X.
 */

const COMPROBANTE = {
  nombre: 'mercadopago.png',
  subidoEl: '2026-09-24T14:05:00Z',
  url: '/api/admin/leads/lead-1/comprobante/archivo',
  clase: 'imagen',
  veredicto: 'revisar',
  hallazgos: [{ campo: 'monto', senal: 'ok', detalle: 'Coincide: ARS 675.000.' }],
};

beforeAll(() => {
  // jsdom no implementa <dialog>.
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.open = false; });
});

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ comprobante: COMPROBANTE }) }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ComprobantePago', () => {
  it('muestra la miniatura del comprobante', async () => {
    render(<ComprobantePago leadId="lead-1" />);

    const miniatura = await screen.findByRole('button', { name: 'Ver el comprobante' });
    expect(miniatura.querySelector('img')?.getAttribute('src')).toBe(COMPROBANTE.url);
  });

  it('abre la vista previa sobre la ficha y la cierra con la X', async () => {
    render(<ComprobantePago leadId="lead-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Ver el comprobante' }));
    expect(screen.getByRole('img', { name: 'Comprobante de pago' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar la vista previa' }));
    expect(screen.queryByRole('img', { name: 'Comprobante de pago' })).not.toBeInTheDocument();
  });

  it('un PDF se ve en el visor, no se descarga', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ comprobante: { ...COMPROBANTE, clase: 'pdf' } }),
    }));
    render(<ComprobantePago leadId="lead-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Ver el comprobante' }));
    expect(screen.getByTitle('Comprobante en PDF')).toBeInTheDocument();
  });
});
