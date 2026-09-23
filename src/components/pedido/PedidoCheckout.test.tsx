import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PedidoCheckout } from './PedidoCheckout';

/**
 * El primer paso: quién compra.
 *
 * Antes este componente se transformaba en el contrato sin cambiar de
 * dirección: el cliente dejaba sus datos, aparecía el contrato y la URL
 * seguía siendo la misma. Tocar «atrás» lo sacaba del pedido entero, porque
 * para el navegador nunca había avanzado a ningún lado.
 */

const assign = vi.fn();

function completar() {
  fireEvent.change(screen.getByLabelText(/Nombre y apellido/i), { target: { value: 'Estefanía Ortigosa' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'este@ejemplo.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Ver el contrato y firmar/i }));
}

const locationReal = window.location;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ modo: 'propia', leadId: 'lead-1' }),
  }));
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname: '/es/pedido/abc', assign },
  });
});

describe('PedidoCheckout', () => {
  it('lleva al paso del contrato, que tiene su propia dirección', async () => {
    render(<PedidoCheckout pedidoId="abc" />);

    completar();

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/es/pedido/abc/firmar'));
  });

  it('usa `assign` y no `replace`: atrás tiene que volver a sus datos', async () => {
    // Es el pedido explícito de quien probó la compra y no pudo corregir un
    // dato mal escrito sin perder la página entera.
    render(<PedidoCheckout pedidoId="abc" />);

    completar();

    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect((window.location as unknown as { replace?: unknown }).replace).toBeUndefined();
  });

  it('avisa del error sin sacarlo de la página', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'No se pudo preparar el contrato.' }),
    }));

    render(<PedidoCheckout pedidoId="abc" />);
    completar();

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo preparar');
    expect(assign).not.toHaveBeenCalled();
  });

  it('cuando el contrato se demora, lo dice y no lo manda a ningún lado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ demorado: true }),
    }));

    render(<PedidoCheckout pedidoId="abc" />);
    completar();

    expect(await screen.findByText(/quedó registrado/i)).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });
});

/**
 * `window.location` se repone al terminar.
 *
 * Pisarlo sin restaurarlo deja el objeto falso puesto para todo lo que corra
 * después en el mismo worker de jsdom, y el que se rompe es otro archivo,
 * lejos de acá. Un test que ensucia el entorno hace fallar a un inocente.
 */
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: locationReal });
});
