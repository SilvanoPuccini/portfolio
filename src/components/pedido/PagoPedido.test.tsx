import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PagoPedido } from './PagoPedido';

/**
 * El paso del pago.
 *
 * «Ya transferí» dejaba a Silvano con un aviso y nada que mirar, y al cliente
 * mirando «recibí tu aviso» para siempre: el pago se aprobaba del otro lado y
 * esta pantalla no se enteraba hasta que recargaba a mano.
 */

const props = {
  pedidoId: 'abc',
  montoUsd: 'USD 940',
  instrucciones: 'Alias: silvano.dev\nCUIT: 20-12345678-9',
  yaInformado: false,
};

const locationReal = window.location;
const reload = vi.fn();

const captura = (name = 'comprobante.png', type = 'image/png') =>
  new File([new Uint8Array(64)], name, { type });

/** El input está oculto a propósito: se llega por su etiqueta. */
const inputArchivo = () => screen.getByLabelText(/Adjuntar el comprobante/i);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
  Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: locationReal });
  vi.useRealTimers();
});

describe('PagoPedido — la transferencia', () => {
  it('abre con la transferencia desplegada: es el único medio que funciona hoy', () => {
    render(<PagoPedido {...props} />);

    expect(screen.getByText(/Alias: silvano.dev/)).toBeInTheDocument();
  });

  it('ofrece Mercado Pago pero dice que todavía no está', () => {
    render(<PagoPedido {...props} />);

    expect(screen.getByText(/Mercado Pago/)).toBeInTheDocument();
    expect(screen.getByText(/Todavía no está disponible/i)).toBeInTheDocument();
  });

  it('se puede plegar lo que no le interesa', () => {
    render(<PagoPedido {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /Transferencia bancaria/i }));

    expect(screen.queryByText(/Alias: silvano.dev/)).not.toBeInTheDocument();
  });
});

describe('PagoPedido — el comprobante', () => {
  it('muestra el archivo elegido para que sepa que quedó adjunto', async () => {
    render(<PagoPedido {...props} />);

    fireEvent.change(inputArchivo(), { target: { files: [captura()] } });

    expect(await screen.findByText('comprobante.png')).toBeInTheDocument();
  });

  it('el botón cambia de nombre cuando hay algo que mandar', async () => {
    render(<PagoPedido {...props} />);

    fireEvent.change(inputArchivo(), { target: { files: [captura()] } });

    expect(await screen.findByRole('button', { name: /Enviar el comprobante/i })).toBeInTheDocument();
  });

  it('lo manda como formulario, con el archivo adentro', async () => {
    render(<PagoPedido {...props} />);

    fireEvent.change(inputArchivo(), { target: { files: [captura()] } });
    fireEvent.click(await screen.findByRole('button', { name: /Enviar el comprobante/i }));

    await waitFor(() => {
      const [, opciones] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(opciones.body).toBeInstanceOf(FormData);
      expect((opciones.body as FormData).get('comprobante')).toBeInstanceOf(File);
    });
  });

  it('se puede quitar el archivo si se equivocó', async () => {
    render(<PagoPedido {...props} />);

    fireEvent.change(inputArchivo(), { target: { files: [captura()] } });
    fireEvent.click(await screen.findByRole('button', { name: /Quitar el comprobante/i }));

    expect(screen.queryByText('comprobante.png')).not.toBeInTheDocument();
  });

  it('rechaza el archivo pesado sin salir a la red', async () => {
    render(<PagoPedido {...props} />);

    const pesado = new File([new Uint8Array(9 * 1024 * 1024)], 'grande.png', { type: 'image/png' });
    fireEvent.change(inputArchivo(), { target: { files: [pesado] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('8 MB');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('avisar sin comprobante sigue valiendo', async () => {
    // El que ya transfirió y no lo encuentra no puede quedar trabado.
    render(<PagoPedido {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /Ya transferí/i }));

    await waitFor(() => {
      const [, opciones] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(opciones.body).toBeUndefined();
    });
  });
});

describe('PagoPedido — la espera', () => {
  it('avisa que la página avanza sola', () => {
    render(<PagoPedido {...props} yaInformado />);

    expect(screen.getByText(/avanza sola cuando confirmo el pago/i)).toBeInTheDocument();
  });

  it('pregunta sola si el pago ya entró, y recarga cuando cambió el paso', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ paso: 'listo' }) }));

    render(<PagoPedido {...props} yaInformado />);

    await vi.advanceTimersByTimeAsync(16_000);

    expect(reload).toHaveBeenCalled();
  });

  it('no recarga mientras sigue en el mismo paso', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ paso: 'pagar' }) }));

    render(<PagoPedido {...props} yaInformado />);

    await vi.advanceTimersByTimeAsync(46_000);

    expect(reload).not.toHaveBeenCalled();
  });

  it('no pregunta nada mientras todavía no avisó', async () => {
    vi.useFakeTimers();

    render(<PagoPedido {...props} />);

    await vi.advanceTimersByTimeAsync(46_000);

    expect(fetch).not.toHaveBeenCalled();
  });
});
